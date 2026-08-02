const express = require('express');
const fs = require('fs');
const path = require('path');
const YAML = require('yaml');
const swaggerUi = require('swagger-ui-express');

const openapiPath = path.join(__dirname, '..', '..', '..', 'openapi.yaml');
const openapiDocument = YAML.parse(fs.readFileSync(openapiPath, 'utf8'));

const router = express.Router();

router.use('/', swaggerUi.serve, swaggerUi.setup(openapiDocument));

module.exports = router;
