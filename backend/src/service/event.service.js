const Event = require('../model/event.model');
const { createNotificationForRole } = require('./notification.service');
const { upsertGroupedRegistrationNotification } = require('./notification.service');
const User = require('../model/user.model');
const { logActivity } = require('./activity-log.service');

const normalizeTicketTypeName = (value) => String(value || '').trim().toLowerCase();

const createEvent = async (eventData, userId) => {
    const { createNotification = true, ...eventPayload } = eventData || {};
    const now = new Date();
    const startDate = new Date(eventPayload?.startDate);
    const endDate = new Date(eventPayload?.endDate);
    const reminderDaysBefore = Number(eventPayload?.reminderDaysBefore ?? 0);
    const isPrivate = Boolean(eventPayload?.isPrivate);
    const rawTicketTypes = Array.isArray(eventPayload?.ticketTypes) ? eventPayload.ticketTypes : [];
    const normalizedTicketTypes = rawTicketTypes.map((ticketType) => ({
        name: typeof ticketType?.name === 'string' ? ticketType.name.trim() : '',
        maxPlaces:
            ticketType?.maxPlaces === null || ticketType?.maxPlaces === undefined || ticketType?.maxPlaces === ''
                ? null
                : Number(ticketType.maxPlaces),
        paf:
            ticketType?.paf === null || ticketType?.paf === undefined || ticketType?.paf === ''
                ? null
                : Number(ticketType.paf)
    }));

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
        throw new Error('Les dates de début et de fin sont obligatoires.');
    }

    if (startDate < now) {
        throw new Error('La date de début doit être postérieure ou égale à la date actuelle.');
    }

    if (endDate < startDate) {
        throw new Error('La date de fin doit être postérieure à la date de début.');
    }

    if (!Number.isInteger(reminderDaysBefore) || reminderDaysBefore < 0) {
        throw new Error('Le rappel doit être un nombre de jours positif ou nul.');
    }

    if (isPrivate) {
        if (normalizedTicketTypes.length === 0) {
            throw new Error('Au moins un type de billet est obligatoire pour un évènement privé.');
        }

        for (const ticketType of normalizedTicketTypes) {
            if (!ticketType.name) {
                throw new Error('Chaque type de billet doit avoir un nom.');
            }
            if (!Number.isInteger(ticketType.maxPlaces) || ticketType.maxPlaces <= 0) {
                throw new Error('Le max de places doit être un entier strictement positif pour chaque type de billet.');
            }
            if (!Number.isFinite(ticketType.paf) || ticketType.paf < 0) {
                throw new Error('La PAF doit être un nombre positif ou nul pour chaque type de billet.');
            }
        }
    }

    const event = await Event.create({
        ...eventPayload,
        startDate,
        endDate,
        reminderDaysBefore,
        isPrivate,
        ticketTypes: isPrivate ? normalizedTicketTypes : [],
        createdBy: userId
    });
    const user = await User.findById(userId).select('role');

    if(event.status === 'PUBLISHED' && createNotification) {
        await createNotificationForRole(event.targetRoles, {
            title: event.title,
            message: event.description,
            type: 'INFO'
        });
    }

    try {
        await logActivity({
            userId,
            actorRole: user?.role || 'ADMIN',
            actionType: 'EVENT_CREATED',
            entityType: 'EVENT',
            entityId: event._id,
            metadata: {
                eventTitle: event.title,
                status: event.status
            }
        });
    } catch (error) {
        console.error('log EVENT_CREATED error:', error);
    }

    return event;
};

const registerClientToPrivateEvent = async (eventId, userId, ticketTypeName) => {
    if (!eventId) {
        throw new Error("L'identifiant de l'évènement est requis.");
    }

    const normalizedRequestedTypeName = normalizeTicketTypeName(ticketTypeName);
    if (!normalizedRequestedTypeName) {
        throw new Error('Le type de billet est requis.');
    }

    const event = await Event.findById(eventId);
    if (!event) {
        throw new Error("L'évènement est introuvable.");
    }

    if (!event.isPrivate) {
        throw new Error("L'inscription est uniquement disponible pour les évènements privés.");
    }

    if (event.status !== 'PUBLISHED') {
        throw new Error("L'inscription est impossible sur un évènement non publié.");
    }

    const isAlreadyRegistered = (event.registrations || []).some(
        (registration) => String(registration.user) === String(userId)
    );
    if (isAlreadyRegistered) {
        throw new Error('Vous êtes déjà inscrit à cet évènement.');
    }

    const selectedTicketType = (event.ticketTypes || []).find(
        (type) => normalizeTicketTypeName(type.name) === normalizedRequestedTypeName
    );
    if (!selectedTicketType) {
        throw new Error('Type de billet invalide.');
    }

    const registrationsForType = (event.registrations || []).filter(
        (registration) => normalizeTicketTypeName(registration.ticketTypeName) === normalizedRequestedTypeName
    ).length;
    if (registrationsForType >= selectedTicketType.maxPlaces) {
        throw new Error('Ce type de billet est complet.');
    }

    event.registrations.push({
        user: userId,
        ticketTypeName: selectedTicketType.name
    });

    await event.save();

    try {
        const [participantUser, ownerUser] = await Promise.all([
            User.findById(userId).select('nom prenom username'),
            User.findById(event.createdBy).select('role')
        ]);

        if (ownerUser?.role === 'BOUTIQUE') {
            const participantName =
                [participantUser?.prenom, participantUser?.nom].filter(Boolean).join(' ') ||
                participantUser?.username ||
                'Un client';

            await upsertGroupedRegistrationNotification({
                targetUserId: event.createdBy,
                eventId: event._id,
                eventTitle: event.title,
                participantName,
                ticketTypeName: selectedTicketType.name
            });
        }
    } catch (error) {
        console.error('notification EVENT_REGISTRATION error:', error);
    }

    return event;
};

const getAll = async () => {
    return await Event.find();
}

const getEventsByStatus = async (status) => {
    return await Event.find({
        status: status
    }).sort({ startDate : 1 });
};

const getEventsForRoleByStatus = async (role, status, userId) => {
    const query = {};

    if (role === 'ADMIN') {
        // Un admin peut consulter l'ensemble des évènements.
    } else if (role === 'BOUTIQUE') {
        query.$or = [
            { targetRoles: 'ALL' },
            { targetRoles: role },
            { createdBy: userId }
        ];
    } else {
        query.$or = [
            { targetRoles: 'ALL' },
            { targetRoles: role }
        ];
    }

    if (status) {
        query.status = status;
    }

    return await Event.find(query).sort({ startDate: 1 });
};

const getPrivateEventTicketDataForClient = async (eventId, userId) => {
    if (!eventId) {
        throw new Error("L'identifiant de l'évènement est requis.");
    }

    const event = await Event.findById(eventId)
        .populate({
            path: 'createdBy',
            select: 'shopId role nom prenom username',
            populate: {
                path: 'shopId',
                select: 'name logo'
            }
        })
        .lean();

    if (!event) {
        throw new Error("L'évènement est introuvable.");
    }

    if (!event.isPrivate) {
        throw new Error('Aucun ticket à télécharger pour un évènement public.');
    }

    const registrations = Array.isArray(event.registrations) ? event.registrations : [];
    const registrationIndex = registrations.findIndex((item) => String(item.user) === String(userId));
    const registration = registrationIndex >= 0 ? registrations[registrationIndex] : null;
    if (!registration) {
        throw new Error("Vous n'êtes pas inscrit à cet évènement.");
    }

    const ticketNumber = registrationIndex + 1;
    const eventSuffix = String(event._id).slice(-6).toUpperCase();
    const ticketCode = `EVT-${eventSuffix}-${String(ticketNumber).padStart(4, '0')}`;

    return { event, registration, ticketNumber, ticketCode };
};

const getPrivateEventParticipantsForBoutique = async (eventId, boutiqueUserId) => {
    if (!eventId) {
        throw new Error("L'identifiant de l'évènement est requis.");
    }

    const event = await Event.findById(eventId)
        .populate({ path: 'registrations.user', select: 'nom prenom username email' })
        .select('title isPrivate createdBy registrations ticketTypes')
        .lean();

    if (!event) {
        throw new Error("L'évènement est introuvable.");
    }

    if (!event.isPrivate) {
        throw new Error("Cet évènement n'est pas privé.");
    }

    if (String(event.createdBy) !== String(boutiqueUserId)) {
        throw new Error("Vous n'êtes pas autorisé à consulter les participants de cet évènement.");
    }

    const eventSuffix = String(event._id).slice(-6).toUpperCase();
    const participants = (event.registrations || []).map((registration, index) => {
        const participant = registration?.user || {};
        const ticketTypeName = registration?.ticketTypeName || '-';
        const selectedTicketType = (event.ticketTypes || []).find(
            (ticketType) => normalizeTicketTypeName(ticketType?.name) === normalizeTicketTypeName(ticketTypeName)
        );

        return {
            ticketNumber: index + 1,
            ticketCode: `EVT-${eventSuffix}-${String(index + 1).padStart(4, '0')}`,
            ticketTypeName,
            paf: Number(selectedTicketType?.paf ?? 0),
            registeredAt: registration?.registeredAt || null,
            participant: {
                id: participant?._id || null,
                nom: participant?.nom || '',
                prenom: participant?.prenom || '',
                username: participant?.username || '',
                email: participant?.email || ''
            }
        };
    });

    return {
        eventId: event._id,
        eventTitle: event.title,
        participants
    };
};

module.exports = {
    createEvent,
    registerClientToPrivateEvent,
    getPrivateEventTicketDataForClient,
    getPrivateEventParticipantsForBoutique,
    getAll,
    getEventsByStatus,
    getEventsForRoleByStatus
}