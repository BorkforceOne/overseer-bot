// Firebase App (the core Firebase SDK) is always required and must be listed first
import * as firebase from 'firebase-admin';
import { config } from '../../utils/config';

type Firestore = firebase.firestore.Firestore;

export class DataService {
  private _db?: Firestore;

  get db(): Firestore {
    return this._db || this.init();
  }

  init() {
    const serviceAccount = require(__dirname + '../../../../' + config.firebaseSecretsPath);
    firebase.initializeApp({
      credential: firebase.credential.cert(serviceAccount),
      databaseURL: "https://magic-overseer-bot.firebaseio.com"
    });
    this._db = firebase.firestore();
    return this._db;
  }
}
