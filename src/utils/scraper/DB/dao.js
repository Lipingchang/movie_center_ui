import mongoose from 'mongoose';
import config from '@/utils/config_constant';

async function connect() {
  return mongoose.connect(`mongodb://${config.dbAddress}/${config.dbName}`, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
}
