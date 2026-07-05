import type { ILostAndFoundPost } from './lost-and-found.types.js';

// Accepts the plain interface (rather than the hydrated document) because $geoNear
// aggregation results are plain objects, not hydrated Mongoose documents.
export function toLostAndFoundDto(post: ILostAndFoundPost) {
  return {
    id: post._id.toString(),
    reporterId: post.reporterId.toString(),
    type: post.type,
    petName: post.petName,
    species: post.species,
    breed: post.breed,
    description: post.description,
    photoUrls: post.photoUrls,
    lastSeenLocation: post.lastSeenLocation,
    contactPhone: post.contactPhone,
    status: post.status,
    approvalStatus: post.approvalStatus,
    rejectionReason: post.rejectionReason,
    createdAt: post.createdAt,
  };
}
