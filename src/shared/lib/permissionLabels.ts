export const PERMISSION_I18N: Record<string, string> = {
    "business:read": "permissions.business.read",
    "business:write": "permissions.business.write",
    "branch:read": "permissions.branch.read",
    "branch:write": "permissions.branch.write",
    "promo:read": "permissions.promo.read",
    "promo:write": "permissions.promo.write",
    "role:read": "permissions.role.read",
    "role:write": "permissions.role.write",
    "user:read": "permissions.user.read",
    "user:write": "permissions.user.write",
    "membership:read": "permissions.membership.read",
    "membership:write": "permissions.membership.write",
    "imsfee:read": "permissions.imsfee.read",
    "subscription:read": "permissions.subscriptions.read",
    "subscription:write": "permissions.subscriptions.write",
    "document:read": "permissions.document.read",
    "document:write": "permissions.document.write",
    "requisite:read": "permissions.requisites.read",
    "requisite:write": "permissions.requisites.write"
};

export function prettyPerm(code: string) {
    const [entity = "", action = ""] = code.split(":");
    const cap = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s);
    return `${cap(entity)} — ${cap(action)}`;
}
