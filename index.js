const NodeCache = require("node-cache");
const Datalayer = require("chia-datalayer");
const { getChiaRoot } = require("chia-root-resolver");
const defaultConfig = require("./defaultConfig");
const path = require("path");

const { readdir, readFile, writeFile, access, unlink, constants } =
  require("fs").promises;

const memoryCache = new NodeCache();
const callbacks = [];

let intervalHandle;
let config = defaultConfig;

function configure(newConfig) {
  config = { ...config, ...newConfig };
}

const getCacheDirectory = () => {
  const chiaRoot = getChiaRoot();
  return `${chiaRoot}/data_layer/cache`;
};

const registerStore = async (storeId) => {
  try {
    if (memoryCache.has(storeId)) {
      console.log(`StoreId ${storeId} already exists in memory cache.`);
      return;
    }

    const datalayer = new Datalayer(config);
    const response = await datalayer.getRoot({ id: storeId });

    if (response && response.success) {
      const hash = response.hash;

      // Set the hash to memory cache
      memoryCache.set(storeId, hash);

      // Write the hash to the file
      const cacheDirectory = getCacheDirectory();
      const filePath = path.join(cacheDirectory, `${storeId}-root_hash`);

      await writeFile(filePath, hash, "utf8");

      console.log(`Stored root hash for storeId ${storeId} successfully.`);
    } else {
      console.error(`Failed to retrieve root for storeId ${storeId}.`);
    }
  } catch (error) {
    console.error(
      `Error setting root to cache for storeId ${storeId}: ${error}`
    );
    console.trace(error);
  }
};

const unregisterStore = async (storeId) => {
  // Delete from in-memory cache
  const cacheKey = storeId;
  memoryCache.del(cacheKey);

  // Delete root_hash file associated with the storeId if it exists
  const cacheDirectory = getCacheDirectory();
  const filePath = path.join(cacheDirectory, `${storeId}-root_hash`);

  access(filePath, constants.F_OK, (err) => {
    if (!err) {
      // file exists, delete it
      unlink(filePath, (unlinkError) => {
        if (unlinkError) {
          console.error(
            `Error while deleting the root_hash file for storeId ${storeId}: ${unlinkError}`
          );
        } else {
          console.log(
            `Successfully unwatched and deleted cache for storeId ${storeId}.`
          );
        }
      });
    } else {
      console.log(`No root_hash file found for storeId ${storeId} to unwatch.`);
    }
  });
};

async function loadRootHashesToCache() {
  const cacheDirectory = getCacheDirectory();

  try {
    const files = await readdir(cacheDirectory);

    const rootHashFiles = files.filter((filename) =>
      filename.endsWith("-root_hash")
    );

    for (const filename of rootHashFiles) {
      const filePath = path.join(cacheDirectory, filename);
      const content = await readFile(filePath, "utf8");

      // Assuming the filename structure is <storeId>-root_hash, extracting the storeId:
      const storeId = filename.split("-root_hash")[0];

      memoryCache.set(storeId, content);
      console.log(`Loaded content of ${filename} to cache.`);
    }
  } catch (error) {
    console.error(`Error loading root hashes to cache: ${error}`);
  }
}

async function refreshRootHashes() {
  const keys = memoryCache.keys();

  const datalayer = new Datalayer(config);

  for (const storeId of keys) {
    try {
      const response = await datalayer.getRoot({ id: storeId });

      if (response.success) {
        const currentHash = memoryCache.get(storeId);
        if (currentHash !== response.hash) {
          // Update in-memory cache
          memoryCache.set(storeId, response.hash);
          console.log(
            `Updated in-memory cache for ${storeId} with new root hash.`
          );

          // Overwrite cached file
          const cacheFilePath = path.join(
            getCacheDirectory(),
            `${storeId}-root_hash`
          );
          await writeFile(cacheFilePath, response.hash, "utf8");
          console.log(`Updated file cache for ${storeId} with new root hash.`);

          // Call the provided callback with the storeId
          callbacks.forEach((cb) => cb(storeId));
        }
      } else {
        console.error(`Failed to get root for ${storeId}.`);
      }
    } catch (error) {
      console.error(`Error refreshing root hash for ${storeId}: ${error}`);
    }
  }
}

function startWatcher(callback) {
  if (callbacks.length === 0) {
    intervalHandle = setInterval(() => {
      refreshRootHashes();
    }, config.check_for_update_interval); 
  }
  callbacks.push(callback);
}

function stopWatcher(callback) {
  const index = callbacks.indexOf(callback);
  
  if (index > -1) {
    callbacks.splice(index, 1);
  }

  if (callbacks.length === 0 && intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
  }
}


module.exports = {
  configure,
  registerStore,
  unregisterStore,
  startWatcher,
  stopWatcher,
};

// Load root hashes to cache on startup
loadRootHashesToCache();
