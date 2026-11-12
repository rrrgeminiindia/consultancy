/**
 * Firebase Service Layer with Error Handling conformant with system security guidelines
 */

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null,
  authCurrentUser?: any
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: authCurrentUser?.uid || null,
      email: authCurrentUser?.email || null,
      emailVerified: authCurrentUser?.emailVerified || null,
      isAnonymous: authCurrentUser?.isAnonymous || null,
      tenantId: authCurrentUser?.tenantId || null,
      providerInfo:
        authCurrentUser?.providerData?.map((p: any) => ({
          providerId: p.providerId,
          email: p.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export interface FirebaseConnectionStatus {
  isConfigured: boolean;
  projectId?: string;
  databaseId?: string;
  error?: string;
}

export const FirebaseService = {
  getStatus(): FirebaseConnectionStatus {
    try {
      // Check for config or stored connection
      const localCfg = localStorage.getItem('candidateflow_firebase_config_v1');
      if (localCfg) {
        const parsed = JSON.parse(localCfg);
        return {
          isConfigured: true,
          projectId: parsed.projectId,
          databaseId: parsed.databaseId || '(default)'
        };
      }
    } catch {
      // ignore
    }
    return {
      isConfigured: false
    };
  }
};
