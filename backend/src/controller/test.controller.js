const testController = (req, res) => {
  res.json({
    success: true,
    message: 'Le controller test fonctionne ! 🎉'
  });
};

module.exports = testController;