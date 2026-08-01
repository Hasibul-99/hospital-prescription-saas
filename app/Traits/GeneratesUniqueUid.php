<?php

namespace App\Traits;

use Illuminate\Database\UniqueConstraintViolationException;

/**
 * Makes server-side UID generation race-safe.
 *
 * The UID generators (patient_uid, prescription_uid) compute "max + 1" from a
 * LIKE scan, so two concurrent inserts can pick the same value. Both carry a
 * UNIQUE constraint, so the loser hits a unique-violation instead of writing a
 * duplicate. This trait transparently catches that violation on a fresh insert,
 * clears the UID column so the `creating` hook regenerates it from the now-newer
 * max, and retries. No call site needs to change.
 */
trait GeneratesUniqueUid
{
    /** The generated, unique column to recover on collision. */
    abstract protected function uidColumn(): string;

    public function save(array $options = [])
    {
        $maxAttempts = 5;
        $attempt = 0;

        while (true) {
            try {
                return parent::save($options);
            } catch (UniqueConstraintViolationException $e) {
                $column = $this->uidColumn();

                // Only recover a fresh insert colliding on the generated UID.
                // Anything else — an update, a different unique column, or an
                // exhausted retry budget — propagates unchanged.
                if ($this->exists
                    || ++$attempt >= $maxAttempts
                    || ! str_contains($e->getMessage(), $column)) {
                    throw $e;
                }

                // Null it so the model's creating hook regenerates from the
                // current max on the next attempt.
                $this->{$column} = null;
            }
        }
    }
}
