const { join } = require('path');

module.exports = {
  plugins: {
    '@tailwindcss/postcss': {}, // <-- dùng plugin mới
    // 'autoprefixer': {},            // v4 có thể bỏ; giữ cũng không sao
  },
};
