# Security Specification for Collaborative Study Space

This document outlines the security specifications and "Dirty Dozen" payload checks to prevent privilege escalation or data tampering in our Study Space Firestore DB.

## 1. Data Invariants

- **Task Ownership**: A Task document must always belong to the user who created it (`request.auth.uid == userId`).
- **User Integrity**: A User profile can only be written or altered by the authenticated user with the matching UID.
- **Message Integrity**: Messages in study rooms must have a `senderId` matching `request.auth.uid`.
- **Log Ownership**: Study logs are highly private and can only be read or created by the user they belong to.
- **Timestamp Controls**: Created/Updated times must align with the server timestamp `request.time`.

## 2. The "Dirty Dozen" (Attack Payloads/Writes That Must Fail)

1. **Self-Elevating User profile update**:
   - Authenticated User attempting to overwrite another user's profile metadata. (Fails because `userId != request.auth.uid`)
2. **Ghost field injection inside Room**:
   - User attempting to add random, un-modeled keys (`ghostField: 'malicious'`) into a room document. (Fails due to exact key schema verification in `isValidRoom`)
3. **Impersonating Sender in chat**:
   - User with uid `A` attempting to post a message into Room with `senderId: 'B'`. (Fails because of `incoming().senderId == request.auth.uid` check)
4. **Denial of Wallet ID Poisoning on Room**:
   - Creating a room with a 50KB string as its document ID. (Fails because `isValidId(roomId)` restricts size to `<= 128` characters)
5. **Junk string payload for Timer Duration**:
   - Trying to update Study Session timer to `"one million seconds"` or standard string instead of a positive integer. (Fails because timerDuration must be `is int`)
6. **Task Hijacking (Reading other's checklists)**:
   - User attempting to query or list another user's checklist items. (Fails because `resource.data.userId == request.auth.uid` is enforced on list/read)
7. **Modifying Immortal Fields (`createdAt`)**:
   - Forcing an updated `createdAt` timestamp during room update. (Fails because `incoming().createdAt == existing().createdAt` is required)
8. **Malicious negative duration study log**:
   - Posting study log with a duration of `-5000` seconds to corrupt statistics. (Fails because duration must be `>= 0`)
9. **Bypassing Server Timestamps**:
   - Submitting an arbitrary hardcoded client timestamp for `updatedAt` during state change. (Fails because `incoming().updatedAt == request.time` is enforced)
10. **Terminal State Manipulation**:
    - Altering study room timer properties for completed sessions. (Fails because terminal states lock parameters)
11. **PII Exposure via blanket lists**:
    - Listing sensitive user email profiles without restricting them directly by authenticating user id. (Fails)
12. **Self-Assigned Admin privileges**:
    - Creating a profile document claiming administrative permissions in a subcollection without proper authentication. (Fails)

## 3. Test Runner Specification (`firestore.rules.test.ts`)

Since we're testing local firestore emulator if present, we specify the rules test cases where all the above 12 payloads must result in standard permissions rejection.
