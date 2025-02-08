const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

// 处理 manifest.json 中的路径
function processManifestPaths(manifest, isDevelopment) {
    // 需要处理的路径字段
    const processPath = (path) => {
        return isDevelopment ? path.replace(/^\//, '') : path;
    };

    // 处理图标路径
    if (manifest.action?.default_icon) {
        Object.keys(manifest.action.default_icon).forEach(size => {
            manifest.action.default_icon[size] = processPath(manifest.action.default_icon[size]);
        });
    }

    if (manifest.icons) {
        Object.keys(manifest.icons).forEach(size => {
            manifest.icons[size] = processPath(manifest.icons[size]);
        });
    }

    // 处理 popup 路径
    if (manifest.action?.default_popup) {
        manifest.action.default_popup = processPath(manifest.action.default_popup);
    }

    // 处理 background script 路径
    if (manifest.background?.service_worker) {
        manifest.background.service_worker = processPath(manifest.background.service_worker);
    }

    // 处理 content scripts 路径
    if (manifest.content_scripts) {
        manifest.content_scripts.forEach(script => {
            if (script.js) {
                script.js = script.js.map(processPath);
            }
            if (script.css) {
                script.css = script.css.map(processPath);
            }
        });
    }

    return manifest;
}

module.exports = (env, argv) => {
    const isDevelopment = argv.mode === 'development';
    
    return {
        entry: {
            popup: './src/popup/popup.js',
            content: './src/content/content.js',
            background: './src/background/background.js'
        },
        output: {
            path: path.resolve(__dirname, 'dist'),
            filename: '[name]/[name].js',
            clean: true
        },
        module: {
            rules: [
                {
                    test: /\.ts$/,
                    use: 'ts-loader',
                    exclude: /node_modules/,
                },
            ],
        },
        resolve: {
            extensions: ['.ts', '.js'],
            fallback: {
                url: require.resolve('url/'),
                path: require.resolve('path-browserify')
            }
        },
        plugins: [
            new CopyPlugin({
                patterns: [
                    // 复制静态资源
                    {
                        from: "public",
                        to: "",
                        globOptions: {
                            ignore: ["**/manifest.json"]  // 忽略 manifest.json，因为我们要单独处理它
                        }
                    },
                    // 处理 manifest.json
                    {
                        from: "public/manifest.json",
                        to: "manifest.json",
                        transform(content) {
                            const manifest = JSON.parse(content.toString());
                            const processedManifest = processManifestPaths(manifest, isDevelopment);
                            return JSON.stringify(processedManifest, null, 2);
                        },
                    },
                    // 复制 popup 相关文件
                    {
                        from: "src/popup/popup.html",
                        to: "popup/popup.html"
                    },
                    {
                        from: "src/popup/popup.css",
                        to: "popup/popup.css"
                    }
                ],
            }),
        ],
        devtool: isDevelopment ? 'source-map' : false
    };
};