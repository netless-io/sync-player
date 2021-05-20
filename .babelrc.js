module.exports =
    process.env === "production"
        ? {
              presets: [
                  [
                      "@babel/preset-env",
                      {
                          modules: false,
                          loose: true,
                      },
                  ],
                  ["@babel/preset-typescript"],
              ],
              plugins: [
                  "const-enum",
                  [
                      "@babel/plugin-transform-runtime",
                      {
                          version: "^7.14.0",
                      },
                  ],
                  [
                      "@babel/plugin-proposal-class-properties",
                      {
                          loose: true,
                      },
                  ],
              ],
          }
        : {
              presets: [
                  [
                      "@babel/preset-env",
                      {
                          targets: "last 1 Chrome version",
                          modules: false,
                          loose: true,
                      },
                  ],
                  ["@babel/preset-typescript"],
              ],
              plugins: [
                  "const-enum",
                  [
                      "@babel/plugin-proposal-class-properties",
                      {
                          loose: true,
                      },
                  ],
              ],
          };
