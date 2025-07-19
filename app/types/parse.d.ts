declare module 'parse/react-native' {
  import * as Parse from 'parse';
  export * from 'parse';
  export { default } from 'parse';
  
  export function initializeParse(
    serverURL: string,
    applicationId: string,
    javascriptKey?: string
  ): void;
  
  export function setAsyncStorage(storage: any): void;
}

declare module 'parse' {
  interface AuthData {
    [key: string]: any;
  }

  interface FullOptions {
    useMasterKey?: boolean;
    sessionToken?: string;
    installationId?: string;
    [key: string]: any;
  }

  interface SaveOptions extends FullOptions {
    cascadeSave?: boolean;
    fetchWhenSave?: boolean;
  }

  interface DestroyOptions extends FullOptions {
    context?: any;
  }

  class BaseObject {
    static extend(className: string, protoProps?: any, classProps?: any): any;
    static fetchAll<T extends ParseObject>(
      list: T[],
      options?: FullOptions
    ): Promise<T[]>;
    static fetchAllIfNeeded<T extends ParseObject>(
      list: T[],
      options?: FullOptions
    ): Promise<T[]>;
    static fromJSON(
      json: any,
      override?: boolean
    ): any;
    static registerSubclass<T extends ParseObject>(
      className: string,
      clazz: new (attributes?: any) => T
    ): void;
    static subclass(className: string): any;
  }

  export class ParseObject extends BaseObject {
    id: string;
    attributes: any;
    createdAt: Date;
    updatedAt: Date;
    
    constructor(className?: string, attributes?: any, options?: any);
    
    add(attr: string, item: any): this;
    addAll(attr: string, items: any[]): this;
    addAllUnique(attr: string, items: any[]): this;
    addUnique(attr: string, item: any): this;
    changedAttributes(diff: any): boolean;
    clear(options?: any): this;
    clone(): this;
    destroy(options?: DestroyOptions): Promise<this>;
    dirty(attr?: string): boolean;
    dirtyKeys(): string[];
    equals(other: any): boolean;
    escape(attr: string): string;
    existed(): boolean;
    fetch(options?: FullOptions): Promise<this>;
    get(attr: string): any;
    getACL(): ACL | undefined;
    has(attr: string): boolean;
    hasChanged(attr: string): boolean;
    increment(attr: string, amount?: number): this;
    isNew(): boolean;
    isValid(): boolean;
    op(attr: string): any;
    previous(attr: string): any;
    previousAttributes(): any;
    relation(attr: string): Relation;
    remove(attr: string, item: any): this;
    removeAll(attr: string, items: any[]): this;
    save(attrs?: any, options?: SaveOptions): Promise<this>;
    save(key: string, value: any, options?: SaveOptions): Promise<this>;
    set(key: string, value: any, options?: any): this;
    setACL(acl: ACL, options?: any): this;
    toJSON(): any;
    unset(attr: string, options?: any): this;
    validate(attrs: any, options?: any): Error | null;
  }

  export class User extends ParseObject {
    static logInWith(arg0: string, arg1: { authData: { id: any; id_token: any; access_token: any; }; }) {
      throw new Error("Method not implemented.");
    }
    static current(): User | null;
    static currentAsync(): Promise<User | null>;
    static signUp(username: string, password: string, attrs: any, options?: any): Promise<User>;
    static logIn(username: string, password: string, options?: any): Promise<User>;
    static logOut(): Promise<void>;
    static requestPasswordResetEmail(email: string, options?: any): Promise<void>;
    static become(sessionToken: string, options?: any): Promise<User>;
    static allowCustomUserClass(isAllowed: boolean): void;
    static enableUnsafeCurrentUser(): void;
    
    static readOnlyAttributes(): string[];
    static _clearCache(): void;
    static _registerAuthenticationProvider(provider: any): void;
    
    signUp(attrs?: any, options?: any): Promise<this>;
    logIn(options?: any): Promise<this>;
    linkWith(authData: AuthData, options?: any): Promise<this>;
    linkWith(provider: string, authData: AuthData, options?: any): Promise<this>;
    linkWith(provider: string, options: any, authData: AuthData): Promise<this>;
    
    authenticated(): boolean;
    isCurrent(): boolean;
    isCurrentUser(): boolean;
    
    getEmail(): string | undefined;
    setEmail(email: string, options?: any): boolean;
    
    getUsername(): string | undefined;
    setUsername(username: string, options?: any): boolean;
    
    getSessionToken(): string;
    
    getPassword(): string | undefined;
    setPassword(password: string, options?: any): boolean;
    
    getACL(): ACL | undefined;
    setACL(acl: ACL, options?: any): boolean;
    
    fetchWithInclude(keys: string | string[], options?: any): Promise<this>;
  }

  export class Query<T extends ParseObject = ParseObject> {
    constructor(objectClass: string | (new () => T));
    
    addAscending(key: string): this;
    addDescending(key: string): this;
    ascending(...keys: string[]): this;
    containedIn(key: string, values: any[]): this;
    contains(key: string, value: string): this;
    containsAll(key: string, values: any[]): this;
    containsAllStartingWith(key: string, values: string[]): this;
    count(options?: any): Promise<number>;
    descending(...keys: string[]): this;
    doesNotExist(key: string): this;
    doesNotMatchKeyInQuery<T>(key: string, queryKey: string, query: Query<T>): this;
    doesNotMatchQuery(key: string, query: Query<T>): this;
    each(callback: (obj: T) => any, options?: any): Promise<void>;
    endsWith(key: string, suffix: string): this;
    equalTo(key: string, value: any): this;
    exists(key: string): this;
    find(options?: any): Promise<T[]>;
    first(options?: any): Promise<T | undefined>;
    get(objectId: string, options?: any): Promise<T>;
    greaterThan(key: string, value: any): this;
    greaterThanOrEqualTo(key: string, value: any): this;
    include(...keys: string[]): this;
    include(keys: string): this;
    lessThan(key: string, value: any): this;
    lessThanOrEqualTo(key: string, value: any): this;
    limit(n: number): this;
    matches(key: string, regex: RegExp, modifiers?: string): this;
    matchesKeyInQuery<T>(key: string, queryKey: string, query: Query<T>): this;
    matchesQuery(key: string, query: Query<T>): this;
    near(key: string, point: any): this;
    notContainedIn(key: string, values: any[]): this;
    notEqualTo(key: string, value: any): this;
    polygonContains(key: string, point: any): this;
    select(...keys: string[]): this;
    skip(n: number): this;
    startsWith(key: string, prefix: string): this;
    subscribe(): Events;
    toJSON(): any;
    withCount(): this;
  }

  export class ACL {
    constructor(arg1?: any);
    
    getPublicReadAccess(): boolean;
    setPublicReadAccess(allowed: boolean): void;
    
    getPublicWriteAccess(): boolean;
    setPublicWriteAccess(allowed: boolean): void;
    
    getReadAccess(userId: User | string): boolean;
    setReadAccess(userId: User | string, allowed: boolean): void;
    
    getWriteAccess(userId: User | string): boolean;
    setWriteAccess(userId: User | string, allowed: boolean): void;
    
    getRoleReadAccess(role: Role | string): boolean;
    setRoleReadAccess(role: Role | string, allowed: boolean): void;
    
    getRoleWriteAccess(role: Role | string): boolean;
    setRoleWriteAccess(role: Role | string, allowed: boolean): void;
    
    toJSON(): any;
  }

  export class Role extends ParseObject {
    constructor(name: string, acl: ACL);
    
    getName(): string;
    setName(name: string, options?: any): boolean;
    
    getUsers(): Relation;
    getRoles(): Relation;
  }

  export class Relation {
    parent: ParseObject;
    key: string;
    targetClassName: string;
    
    constructor(parent?: ParseObject, key?: string);
    
    add(...objects: ParseObject[]): void;
    query(): Query<ParseObject>;
    remove(...objects: ParseObject[]): void;
    toJSON(): any;
  }

  export class Events {
    on(event: string, callback: Function, context?: any): Events;
    off(event?: string, callback?: Function, context?: any): Events;
    trigger(event: string, ...args: any[]): Events;
    once(events: string, callback: Function, context?: any): Events;
    stopListening(events?: string, callback?: Function, context?: any): Events;
    listenTo(object: any, events: string, callback: Function, context?: any): Events;
    listenToOnce(object: any, events: string, callback: Function, context?: any): Events;
    stopListeningTo(object?: any, events?: string, callback?: Function): Events;
  }

  // Cloud functions
  export namespace Cloud {
    function run(name: string, data?: any, options?: any): Promise<any>;
    function getJobsData(): any;
    function startJob(name: string, data: any): Promise<any>;
    function useMasterKey(): void;
  }

  // Core functions
  export function initialize(
    applicationId: string,
    javaScriptKey?: string,
    masterKey?: string
  ): void;
  
  export function setAsyncStorage(storage: any): void;
  export function enableLocalDatastore(): void;
  
  export const applicationId: string;
  export const javaScriptKey: string;
  export const masterKey: string;
  export const serverURL: string;
  export const serverAuthToken: string | undefined;
  export const serverAuthType: string | undefined;
  export const liveQueryServerURL: string | undefined;
  
  export const Object: typeof ParseObject & {
    extend(className: string, protoProps?: any, classProps?: any): any;
    registerSubclass<T extends ParseObject>(
      className: string,
      clazz: new (attributes?: any) => T
    ): void;
  };
  
  export const User: typeof User & {
    allowCustomUserClass(allow: boolean): void;
    become(sessionToken: string, options?: any): Promise<User>;
    current(): User | null;
    currentAsync(): Promise<User | null>;
    logIn(username: string, password: string, options?: any): Promise<User>;
    logOut(): Promise<void>;
    requestPasswordResetEmail(email: string, options?: any): Promise<void>;
    signUp(username: string, password: string, attrs: any, options?: any): Promise<User>;
  };
  
  export const Query: typeof Query;
  export const ACL: typeof ACL;
  export const Role: typeof Role;
  export const Installation: typeof ParseObject;
  export const Session: typeof ParseObject;
  
  export const Analytics: {
    track(name: string, dimensions?: any): Promise<void>;
  };
  
  export const Cloud: typeof Cloud;
  
  export const LiveQuery: {
    on(event: string, callback: Function): void;
    off(event: string, callback: Function): void;
    open(): void;
    close(): void;
    subscribe<T extends ParseObject = ParseObject>(
      query: Query<T>,
      sessionToken?: string
    ): Events;
    unsubscribe(query: Query, callback?: Function): void;
  };
  
  export const LocalDatastore: {
    isEnabled: boolean;
    pin<T>(name: string, value: T): Promise<void>;
    pin<T>(value: T): Promise<void>;
    pinWithName<T>(name: string, value: T): Promise<void>;
    unPin(name: string): Promise<void>;
    unPinAll(): Promise<void>;
    fromPin<T>(name: string): Promise<T>;
    fromPinWithName<T>(name: string): Promise<T>;
    getKeyForObject(object: ParseObject): string;
  };
  
  export const Config: {
    get(): Promise<{ [key: string]: any }>;
    get(option: string): Promise<any>;
    save(attrs: any): Promise<void>;
  };
  
  export const File: {
    new (name: string, data: any, type?: string): ParseObject;
    createFromUri(uri: string, name?: string, type?: string, options?: any): Promise<ParseObject>;
  };
  
  export const GeoPoint: {
    new (latitude: number, longitude: number): any;
  };
  
  export const Polygon: {
    new (coordinates: any[]): any;
  };
  
  export const Op: {
    Set: any;
    Unset: any;
    Increment: any;
    Add: any;
    Remove: any;
    AddUnique: any;
    RemoveAll: any;
  };
  
  export function enableEncryptedUser(): void;
  export function enableLocalDatastore(): void;
  export function isLocalDatastoreEnabled(): boolean;
  
  export function setLocalDatastoreController(controller: any): void;
  
  export function setServerURL(url: string): void;
  export function setRequestMimeType(mimeType: string): void;
  
  export function setEncryptedUser(encryptedUser: string): void;
  export function getEncryptedUser(): string | null;
  
  export function setAsyncStorage(storage: any): void;
  
  export function setLocalDatastore(persistenceController: any): void;
  
  export function setSecret(secret: string): void;
  
  export function setSessionToken(sessionToken: string): void;
  
  export function setServerAuthToken(authToken: string, authType: string): void;
  
  export function setServerAuthTokens(tokens: { [key: string]: string }): void;
  
  export function setServerAuthTypes(authTypes: string[]): void;
  
  export function setServerURL(url: string, mount: string): void;
  
  export function setLiveQueryServerURL(url: string): void;
  
  export function setServerAuthType(type: string): void;
  
  export function setServerAuthTokenAndType(authToken: string, authType: string): void;
  
  export function setServerAuthTokensAndTypes(tokens: { [key: string]: string }): void;
  
  export function setServerAuthTypes(types: string[]): void;
  
  export function setServerURLs(params: {
    serverURL: string;
    mountPath?: string;
    liveQueryServerURL?: string;
  }): void;
}
