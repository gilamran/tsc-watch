let rewritePaths = async (options) => {};

try {
  const tspm = require('@ef-carbon/tspm');
  rewritePaths = async (options) => {
    if (!options.tsconfig) return;
    const files = new Set();

    for await (const mapped of tspm.default(options)) {
      files.add(mapped.file);
    }
    for (const file of files) {
      await file.write();
    }
  }
} catch (error) {
  rewritePaths = async (options) => {};
}

module.exports = rewritePaths;
