PRAGMA foreign_keys = ON;

-- Products are save-only community targets. Rebuild the two constrained tables
-- rather than weakening likes, comments, reposts, or canonical post targets.
CREATE TABLE saved_items_v2 (
  member_id TEXT NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('post', 'story', 'athlete', 'team', 'competition', 'video', 'product')),
  target_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (member_id, target_type, target_id),
  FOREIGN KEY (member_id) REFERENCES member_profiles(id) ON DELETE CASCADE
);

INSERT INTO saved_items_v2 (member_id, target_type, target_id, created_at)
SELECT member_id, target_type, target_id, created_at FROM saved_items;

DROP TABLE saved_items;
ALTER TABLE saved_items_v2 RENAME TO saved_items;

CREATE INDEX saved_items_member_idx
  ON saved_items(member_id, created_at DESC);

CREATE TABLE collection_items_v2 (
  collection_id TEXT NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('post', 'story', 'athlete', 'team', 'competition', 'video', 'product')),
  target_id TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0 CHECK (display_order >= 0),
  added_at TEXT NOT NULL,
  PRIMARY KEY (collection_id, target_type, target_id),
  FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE
);

INSERT INTO collection_items_v2 (
  collection_id,
  target_type,
  target_id,
  display_order,
  added_at
)
SELECT collection_id, target_type, target_id, display_order, added_at
FROM collection_items;

DROP TABLE collection_items;
ALTER TABLE collection_items_v2 RENAME TO collection_items;

CREATE INDEX collection_items_order_idx
  ON collection_items(collection_id, display_order, added_at);

-- Private authorization records only. Organization identity remains canonical
-- in Sanity; D1 stores no claim contact details, invitations, or credentials.
CREATE TABLE organization_memberships (
  id TEXT PRIMARY KEY NOT NULL,
  member_id TEXT NOT NULL,
  organization_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN (
    'owner',
    'administrator',
    'editor',
    'commerce-manager',
    'media-manager',
    'representative'
  )),
  capabilities_json TEXT NOT NULL DEFAULT '[]'
    CHECK (json_valid(capabilities_json) AND json_type(capabilities_json) = 'array'),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',
    'active',
    'suspended',
    'revoked',
    'expired'
  )),
  reviewed_by_principal_id TEXT,
  reviewed_at TEXT,
  granted_at TEXT,
  revoked_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (member_id) REFERENCES member_profiles(id) ON DELETE CASCADE,
  UNIQUE (organization_id, member_id),
  CHECK (
    status != 'active' OR (
      reviewed_by_principal_id IS NOT NULL AND
      reviewed_at IS NOT NULL AND
      granted_at IS NOT NULL
    )
  ),
  CHECK (status NOT IN ('revoked', 'expired') OR revoked_at IS NOT NULL)
);

CREATE INDEX organization_memberships_member_status_idx
  ON organization_memberships(member_id, status, updated_at DESC);

CREATE INDEX organization_memberships_organization_status_idx
  ON organization_memberships(organization_id, status, role);
