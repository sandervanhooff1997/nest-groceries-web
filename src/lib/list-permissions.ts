export type ListRole = 'creator' | 'co-owner' | 'participant' | 'none';

export interface ListAccessSubject {
  createdBy?: string;
  owners?: Array<{ email: string }>;
  participants?: Array<{ email: string }>;
}

export interface ListViewer {
  userId: string | undefined;
  email: string | null | undefined;
}

export function getListRole(
  list: ListAccessSubject,
  viewer: ListViewer,
): ListRole {
  if (!viewer.userId && !viewer.email) return 'none';
  if (viewer.userId && list.createdBy === viewer.userId) return 'creator';
  if (viewer.email) {
    if (list.owners?.some((o) => o.email === viewer.email)) return 'co-owner';
    if (list.participants?.some((p) => p.email === viewer.email)) return 'participant';
  }
  return 'none';
}

export interface ListPermissions {
  canShare: boolean;
  canDuplicate: boolean;
  canDelete: boolean;
  canManageItems: boolean;
}

export function getListPermissions(role: ListRole): ListPermissions {
  return {
    canShare: role === 'creator',
    canDuplicate: role === 'creator',
    canDelete: role === 'creator' || role === 'co-owner',
    canManageItems: role !== 'none',
  };
}

export function getRoleLabel(role: ListRole): string | null {
  switch (role) {
    case 'creator':
      return 'Owner';
    case 'co-owner':
      return 'Co-owner';
    case 'participant':
      return 'Participant';
    default:
      return null;
  }
}
