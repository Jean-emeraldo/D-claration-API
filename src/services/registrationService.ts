import { env } from '../config/env.js';
import { getFirebaseAuth } from '../config/firebase.js';
import { getRegistrationByEmail, getRegistrationById, updateRegistrationById, upsertRegistrationRequest } from '../db/repository.js';
import { generateOtp, generateSecurePassword, hashValue } from '../lib/crypto.js';
import { sendMail } from '../lib/mailer.js';

export async function requestRegistration(data: {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
}) {
  const email = data.email.trim().toLowerCase();
  const otp = generateOtp();
  const otpExpiresAt = new Date(Date.now() + env.otpTtlMinutes * 60_000);

  const record = await upsertRegistrationRequest({
    email,
    firstName: data.firstName.trim(),
    lastName: data.lastName.trim(),
    phone: data.phone?.trim(),
    otp,
    otpExpiresAt,
  });

  const message = `Votre code de vérification est: ${otp}. Il expire dans ${env.otpTtlMinutes} minutes.`;
  await sendMail({
    to: email,
    subject: 'Code de vérification de votre inscription',
    text: message,
    html: `<p>Votre code de vérification est: <strong>${otp}</strong></p><p>Il expire dans ${env.otpTtlMinutes} minutes.</p>`,
  });

  return {
    id: record.id,
    status: record.status,
    expiresInMinutes: env.otpTtlMinutes,
    message: 'OTP sent successfully',
  };
}

export async function verifyOtp(email: string, otp: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const registration = await getRegistrationByEmail(normalizedEmail);

  if (!registration) {
    throw new Error('Registration not found.');
  }

  if (!registration.otp_hash || !registration.otp_expires_at) {
    throw new Error('OTP is not available for this registration.');
  }

  const expired = new Date(registration.otp_expires_at).getTime() < Date.now();

  if (expired) {
    throw new Error('OTP expired. Please request a new one.');
  }

  if (hashValue(otp) !== registration.otp_hash) {
    throw new Error('Invalid OTP.');
  }

  const updated = await updateRegistrationById(registration.id, {
    status: 'awaiting_approval',
    otp_hash: null,
    otp_expires_at: null,
  });

  return {
    id: updated.id,
    status: 'awaiting_approval',
    email: updated.email,
    message: 'OTP confirmed. The request is now awaiting admin approval.',
  };
}

export async function resendOtp(email: string) {
  const existing = await getRegistrationByEmail(email.trim().toLowerCase());

  if (!existing) {
    throw new Error('Registration not found.');
  }

  const otp = generateOtp();
  const otpExpiresAt = new Date(Date.now() + env.otpTtlMinutes * 60_000);

  await updateRegistrationById(existing.id, {
    otp_hash: hashValue(otp),
    otp_expires_at: otpExpiresAt,
    status: 'pending',
  });

  const message = `Votre nouveau code de vérification est: ${otp}. Il expire dans ${env.otpTtlMinutes} minutes.`;
  await sendMail({
    to: existing.email,
    subject: 'Nouveau code de vérification',
    text: message,
    html: `<p>Votre nouveau code est: <strong>${otp}</strong></p><p>Il expire dans ${env.otpTtlMinutes} minutes.</p>`,
  });

  return { message: 'OTP resent successfully', expiresInMinutes: env.otpTtlMinutes };
}

export async function reviewRegistration(data: {
  requestId?: number;
  email?: string;
  decision: 'approve' | 'reject';
  adminNote?: string;
}) {
  const registration = data.requestId
    ? await getRegistrationById(data.requestId)
    : data.email
      ? await getRegistrationByEmail(data.email.trim().toLowerCase())
      : null;

  if (!registration) {
    throw new Error('Registration request not found.');
  }

  if (registration.status === 'approved' || registration.status === 'rejected') {
    return {
      id: registration.id,
      status: registration.status,
      message: `This request is already ${registration.status}.`,
    };
  }

  if (data.decision === 'reject') {
    const updated = await updateRegistrationById(registration.id, {
      status: 'rejected',
      rejected_at: new Date(),
      admin_note: data.adminNote ?? 'Rejected by administrator',
    });

    await sendMail({
      to: updated.email,
      subject: 'Votre demande d’inscription a été refusée',
      text: `Votre inscription a été refusée. ${data.adminNote ? `Motif: ${data.adminNote}` : ''}`,
    });

    return {
      id: updated.id,
      status: 'rejected',
      message: 'Registration request rejected.',
    };
  }

  let firebaseUid: string;
  let passwordResetLink: string;

  try {
    const firebaseAuth = getFirebaseAuth();
    const password = generateSecurePassword();
    const user = await firebaseAuth.createUser({
      email: registration.email,
      password,
      displayName: `${registration.first_name} ${registration.last_name}`,
      emailVerified: true,
    });

    firebaseUid = user.uid;
    passwordResetLink = await firebaseAuth.generatePasswordResetLink(registration.email);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown Firebase error';
    throw new Error(`Unable to create Firebase user: ${message}`);
  }

  const updated = await updateRegistrationById(registration.id, {
    status: 'approved',
    approved_at: new Date(),
    firebase_uid: firebaseUid,
    admin_note: data.adminNote ?? 'Approved by administrator',
  });

  await sendMail({
    to: registration.email,
    subject: 'Votre compte a été approuvé',
    text: `Votre compte a bien été approuvé. Pour définir votre mot de passe, utilisez ce lien : ${passwordResetLink}`,
    html: `<p>Votre compte a bien été approuvé.</p><p><a href="${passwordResetLink}">Définir mon mot de passe</a></p>`,
  });

  return {
    id: updated.id,
    status: 'approved',
    firebaseUid,
    message: 'Registration approved and Firebase account created.',
  };
}

export async function getRegistrationStatus(id: number) {
  const record = await getRegistrationById(id);

  if (!record) {
    throw new Error('Registration not found.');
  }

  return record;
}
