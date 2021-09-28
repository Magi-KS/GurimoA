module.exports = function (app) {
  app.use((req, res, next) => {
    if (!req.originalUrl.includes(".")) {
      req.originalUrl += ".html";
    }
    next();
  });
};
