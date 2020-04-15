// Firebase App (the core Firebase SDK) is always required and must be listed first
import * as firebase from 'firebase-admin';
import { config } from '../../utils/config';
import * as path from 'path';

type Firestore = firebase.firestore.Firestore;

export class DataService {
  private _db?: Firestore;

  get db(): Firestore {
    return this._db || this.init();
  }

  init() {
    let finalConfigLocation = config.firebaseSecretsPath;

    if (!path.isAbsolute(config.firebaseSecretsPath)) {
      finalConfigLocation = path.resolve(process.cwd(), config.firebaseSecretsPath);
    }

    const serviceAccount = require(finalConfigLocation);
    firebase.initializeApp({
      credential: firebase.credential.cert(serviceAccount),
      databaseURL: "https://magic-overseer-bot.firebaseio.com"
    });
    this._db = firebase.firestore();
    return this._db;
  }
}
