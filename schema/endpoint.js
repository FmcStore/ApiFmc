const swaggerUi = require("swagger-ui-express");
const config = require("./config");
const { SwaggerTheme, SwaggerThemeNameEnum } = require("swagger-themes");

const theme = new SwaggerTheme();
const inUrl = "Please input URL!";
const inQuery = "Please input Query!";

const options = {
  customSiteTitle: config.options.webName,
  customfavIcon: config.options.favicon,
  customJs: [
    "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-bundle.min.js",
    "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-standalone-preset.min.js",
  ],
  customCssUrl: [
    "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui.min.css",
    "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-standalone-preset.min.css",
    "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui.css",
  ],
  customCss: `${theme.getBuffer(SwaggerThemeNameEnum.DARK)}.topbar { display: none; }`,
  swaggerOptions: {
    displayRequestDuration: true,
  },
};

const swaggerDocument = {
  openapi: "3.0.0",
  info: {
    title: config.options.name,
    description: config.options.description,
    version: "1.0.0",
    "x-logo": {
      url: config.options.favicon,
      altText: config.options.name,
    },
  },
  servers: [
    {
      url: config.host.BASE_URL,
    },
  ],
  tags: [
    {
      name: "AI",
      description:
        "API endpoints for artificial intelligence content from various platforms.",
    },
    {
      name: "Uploader",
      description: "API endpoints for uploading files to GitHub storage.",
    },
  ],
  paths: {
    "/api/ai/chatgpt": {
      get: {
        tags: ["AI"],
        summary: "Chat with GPT AI",
        parameters: [
          {
            in: "query",
            name: "query",
            schema: {
              type: "string",
            },
            required: true,
            description: inQuery,
          },
        ],
        responses: {
          200: {
            description: "Result successfully returned",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: {
                      type: "boolean",
                      example: true,
                    },
                    developer: {
                      type: "string",
                      example: config.options.developer,
                    },
                    result: {
                      type: "object",
                      properties: {
                        message: {
                          type: "string",
                          example: "Hello! How can I help you today?",
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/ai/gptlogic": {
      get: {
        tags: ["AI"],
        summary: "Chat with GPT Logic",
        parameters: [
          {
            in: "query",
            name: "query",
            schema: {
              type: "string",
            },
            required: true,
            description: inQuery,
          },
          {
            in: "query",
            name: "prompt",
            schema: {
              type: "string",
            },
            required: true,
            description: inQuery,
          },
        ],
        responses: {
          200: {
            description: "Result successfully returned",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: {
                      type: "boolean",
                      example: true,
                    },
                    developer: {
                      type: "string",
                      example: config.options.developer,
                    },
                    result: {
                      type: "object",
                      properties: {
                        message: {
                          type: "string",
                          example:
                            "Hello! How can I help you with your prompt?",
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/ai/blackbox": {
      get: {
        tags: ["AI"],
        summary: "Get response from Blackbox AI",
        parameters: [
          {
            in: "query",
            name: "query",
            schema: {
              type: "string"
            },
            required: true,
            description: inQuery
          }
        ],
        responses: {
          200: {
            description: "Result successfully returned",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: {
                      type: "boolean",
                      example: true
                    },
                    developer: {
                      type: "string",
                      example: config.options.developer
                    },
                    result: {
                      type: "object",
                      properties: {
                        message: {
                          type: "string",
                          example: "Hello! How can I assist you today?"
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/upload/github": {
      post: {
        tags: ["Uploader"],
        summary: "Upload file to GitHub storage (Base64)",
        description: "Upload file using base64 encoded data. Compatible with Vercel serverless environment.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["file"],
                properties: {
                  file: {
                    type: "string",
                    format: "base64",
                    description: "Base64 encoded file data (with data URI prefix)"
                  },
                  filename: {
                    type: "string",
                    description: "Optional original filename"
                  }
                }
              },
              example: {
                file: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
                filename: "example.png"
              }
            }
          }
        },
        responses: {
          200: {
            description: "File successfully uploaded",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: {
                      type: "boolean",
                      example: true
                    },
                    developer: {
                      type: "string",
                      example: config.options.developer
                    },
                    result: {
                      type: "object",
                      properties: {
                        filename: {
                          type: "string",
                          example: "image-1234567890.png"
                        },
                        url: {
                          type: "string",
                          example: "https://raw.githubusercontent.com/user/repo/branch/uploads/image-1234567890.png"
                        },
                        download_url: {
                          type: "string",
                          example: "https://raw.githubusercontent.com/user/repo/branch/uploads/image-1234567890.png"
                        },
                        size: {
                          type: "number",
                          example: 102400
                        },
                        type: {
                          type: "string",
                          example: "image/png"
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      get: {
        tags: ["Uploader"],
        summary: "Upload file to GitHub from URL",
        parameters: [
          {
            in: "query",
            name: "url",
            schema: {
              type: "string"
            },
            required: true,
            description: "URL of the file to upload"
          }
        ],
        responses: {
          200: {
            description: "File successfully uploaded from URL",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: {
                      type: "boolean",
                      example: true
                    },
                    developer: {
                      type: "string",
                      example: config.options.developer
                    },
                    result: {
                      type: "object",
                      example: {
                        filename: "file-1234567890.jpg",
                        url: "https://raw.githubusercontent.com/user/repo/branch/uploads/file-1234567890.jpg",
                        download_url: "https://raw.githubusercontent.com/user/repo/branch/uploads/file-1234567890.jpg",
                        size: 204800,
                        type: "image/jpeg"
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  "x-request-time": new Date().toISOString(),
};

module.exports = { swaggerDocument, options };
