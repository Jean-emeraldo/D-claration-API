import { pool } from '../config/db.js';
import { hashValue } from '../lib/crypto.js';

export type RegistrationStatus =
  | 'pending'
  | 'verified'
  | 'awaiting_approval'
  | 'approved'
  | 'rejected';

export interface RegistrationRecord {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  status: RegistrationStatus;
  otp_hash: string | null;
  otp_expires_at: Date | null;
  approved_at: Date | null;
  rejected_at: Date | null;
  firebase_uid: string | null;
  admin_note: string | null;
  created_at: Date;
  updated_at: Date;
}

export async function upsertRegistrationRequest(data: {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  otp: string;
  otpExpiresAt: Date;
}): Promise<RegistrationRecord> {
  const otpHash = hashValue(data.otp);

  const result = await pool.query(
    `
      INSERT INTO registration_requests (
        email, first_name, last_name, phone, status, otp_hash, otp_expires_at,
        created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, 'pending', $5, $6, NOW(), NOW())
      ON CONFLICT (email)
      DO UPDATE SET
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        phone = EXCLUDED.phone,
        status = 'pending',
        otp_hash = EXCLUDED.otp_hash,
        otp_expires_at = EXCLUDED.otp_expires_at,
        updated_at = NOW()
      RETURNING *;
    `,
    [data.email, data.firstName, data.lastName, data.phone ?? null, otpHash, data.otpExpiresAt],
  );

  return result.rows[0] as RegistrationRecord;
}

export async function getRegistrationByEmail(email: string): Promise<RegistrationRecord | null> {
  const result = await pool.query('SELECT * FROM registration_requests WHERE email = $1', [email]);
  return result.rows[0] as RegistrationRecord | null;
}

export async function getRegistrationById(id: number): Promise<RegistrationRecord | null> {
  const result = await pool.query('SELECT * FROM registration_requests WHERE id = $1', [id]);
  return result.rows[0] as RegistrationRecord | null;
}

export async function updateRegistrationStatus(
  email: string,
  status: RegistrationStatus,
  updates: Partial<Pick<RegistrationRecord, 'otp_hash' | 'otp_expires_at' | 'firebase_uid' | 'admin_note' | 'approved_at' | 'rejected_at'>> = {},
): Promise<RegistrationRecord> {
  const hasOtp = updates.otp_hash !== undefined;
  const result = await pool.query(
    `
      UPDATE registration_requests
      SET status = $2,
          otp_hash = ${hasOtp ? '$3' : 'otp_hash'},
          otp_expires_at = ${updates.otp_expires_at !== undefined ? '$4' : 'otp_expires_at'},
          firebase_uid = ${updates.firebase_uid !== undefined ? '$5' : 'firebase_uid'},
          admin_note = ${updates.admin_note !== undefined ? '$6' : 'admin_note'},
          approved_at = ${updates.approved_at !== undefined ? '$7' : 'approved_at'},
          rejected_at = ${updates.rejected_at !== undefined ? '$8' : 'rejected_at'},
          updated_at = NOW()
      WHERE email = $1
      RETURNING *;
    `,
    [
      email,
      status,
      ...(hasOtp ? [updates.otp_hash ?? null] : []),
      ...(updates.otp_expires_at !== undefined ? [updates.otp_expires_at] : []),
      ...(updates.firebase_uid !== undefined ? [updates.firebase_uid] : []),
      ...(updates.admin_note !== undefined ? [updates.admin_note] : []),
      ...(updates.approved_at !== undefined ? [updates.approved_at] : []),
      ...(updates.rejected_at !== undefined ? [updates.rejected_at] : []),
    ],
  );

  return result.rows[0] as RegistrationRecord;
}

export async function updateRegistrationById(
  id: number,
  updates: Partial<RegistrationRecord>,
): Promise<RegistrationRecord> {
  const fields: string[] = [];
  const values: unknown[] = [];
  let index = 1;

  for (const [key, value] of Object.entries(updates)) {
    if (value === undefined) continue;
    fields.push(`${key} = $${index}`);
    values.push(value);
    index += 1;
  }

  values.push(id);
  fields.push(`updated_at = NOW()`);

  const result = await pool.query(
    `UPDATE registration_requests SET ${fields.join(', ')} WHERE id = $${index} RETURNING *;`,
    values,
  );

  return result.rows[0] as RegistrationRecord;
}
