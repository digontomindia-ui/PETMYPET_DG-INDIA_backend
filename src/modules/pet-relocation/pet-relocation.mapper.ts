import type { IRelocationRequest } from './pet-relocation.types.js';

/** User-facing DTO. adminNotes is internal ops-only and must never be exposed here. */
export function toRelocationRequestDto(request: IRelocationRequest) {
  return {
    id: request._id.toString(),
    userId: request.userId.toString(),
    ownerName: request.ownerName,
    ownerPhone: request.ownerPhone,
    ownerEmail: request.ownerEmail,
    petId: request.petId.toString(),
    originAddress: request.originAddress,
    destinationAddress: request.destinationAddress,
    relocationDate: request.relocationDate,
    transportType: request.transportType,
    preferredTimeSlot: request.preferredTimeSlot,
    status: request.status,
    createdAt: request.createdAt,
  };
}

/** Admin-facing DTO. Includes internal adminNotes. */
export function toRelocationRequestAdminDto(request: IRelocationRequest) {
  return {
    ...toRelocationRequestDto(request),
    adminNotes: request.adminNotes,
  };
}
