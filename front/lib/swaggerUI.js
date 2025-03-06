const SWAGGER_UI_VERSION = '5.11.0';

export default function setupSwaggerUI() {
  const openApiUrl = new URL('/api/openapi.json', window.location.origin);

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@${SWAGGER_UI_VERSION}/swagger-ui.css" />
    <style>
      .swagger-ui .topbar {
        display: none;
      }
      .swagger-ui .scheme-container {
        box-shadow: none;
      }
    </style>
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@${SWAGGER_UI_VERSION}/swagger-ui-bundle.js" crossorigin></script>
    <script src="https://unpkg.com/swagger-ui-dist@${SWAGGER_UI_VERSION}/swagger-ui-standalone-preset.js" crossorigin></script>
    <script>
      window.onload = () => {
        window.ui = SwaggerUIBundle({
          url: "${openApiUrl.href}",
          dom_id: '#swagger-ui',
          deepLinking: false,
          presets: [
            window.SwaggerUIBundle.presets.apis,
            window.SwaggerUIStandalonePreset,
          ],
          plugins: [
            window.SwaggerUIBundle.plugins.DownloadUrl,
          ],
          layout: 'StandaloneLayout',
        });
      };
    </script>
  </body>
</html>`;
}
