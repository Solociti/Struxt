import { MongoMemoryServer } from 'mongodb-memory-server';

let instance: MongoMemoryServer;

export default async function setup() {
  instance = await MongoMemoryServer.create();
  const uri = instance.getUri();
  
  // Set env vars for all test threads
  process.env.MONGODB_URI = uri;
  process.env.IS_DOCKER = "false";

  return async () => {
    await instance.stop();
  };
}
