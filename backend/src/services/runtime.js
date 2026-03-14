function useFileStore() {
  return process.env.USE_FILE_STORE === "1" || !process.env.DATABASE_URL;
}

module.exports = { useFileStore };
