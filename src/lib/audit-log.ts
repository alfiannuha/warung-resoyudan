import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

export type AuditAction = "create" | "update" | "delete";
export type AuditEntity = "product" | "transaction" | "debt";

export async function createAuditLog(params: {
  action: AuditAction;
  entity: AuditEntity;
  entityId: string;
  description: string;
}) {
  try {
    await addDoc(collection(db, "audit_logs"), {
      action: params.action,
      entity: params.entity,
      entityId: params.entityId,
      description: params.description,
      createdAt: serverTimestamp(),
    });
  } catch {
    // Silent fail — audit log tidak boleh mengganggu operasi utama
  }
}
