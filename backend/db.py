import os
import psycopg2
from psycopg2 import pool
from dotenv import load_dotenv

load_dotenv()

class _PooledConnection:
    """Thin wrapper around a psycopg2 connection so conn.close() returns it to the pool."""
    def __init__(self, conn, db_pool):
        self._conn = conn
        self._pool = db_pool
        self._returned = False

    def cursor(self, *args, **kwargs):
        return self._conn.cursor(*args, **kwargs)

    def commit(self):
        return self._conn.commit()

    def rollback(self):
        return self._conn.rollback()

    def close(self):
        if not self._returned:
            self._returned = True
            self._pool.putconn(self._conn)

    def __getattr__(self, name):
        return getattr(self._conn, name)

db_pool = None
try:
    db_pool = pool.ThreadedConnectionPool(1, 10, dsn=os.getenv("DATABASE_URL"))
except Exception as e:
    print(f"[DB ERROR] Could not initialize connection pool: {e}")

def get_db_connection():
    """Fetches a connection from the ThreadedConnectionPool."""
    if db_pool is not None:
        conn = db_pool.getconn()
        return _PooledConnection(conn, db_pool)
    return psycopg2.connect(os.getenv("DATABASE_URL"))

def create_session(session_id):
    """Creates a new chat session (ignores if it already exists)."""
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute(
            "INSERT INTO sessions (id) VALUES (%s) ON CONFLICT DO NOTHING;", 
            (session_id,)
        )
        conn.commit()
        cur.close()
    except Exception as e:
        if conn:
            try:
                conn.rollback()
            except Exception:
                pass
        print(f"[DB ERROR] Could not create session: {e}")
    finally:
        if conn:
            conn.close()

def save_message(session_id, role, content, agent=None, model_used=None, provider=None, latency_ms=None, fallback_triggered=False):
    """Saves a chat message and its telemetry to the database."""
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute(
            """
            INSERT INTO messages (session_id, role, content, agent, model_used, provider, latency_ms, fallback_triggered)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (session_id, role, content, agent, model_used, provider, latency_ms, fallback_triggered)
        )
        conn.commit()
        cur.close()
    except Exception as e:
        if conn:
            try:
                conn.rollback()
            except Exception:
                pass
        print(f"[DB ERROR] Could not save message: {e}")
    finally:
        if conn:
            conn.close()

def get_all_sessions():
    """Returns all unique sessions ordered by the most recent message, along with the first user prompt as title."""
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute(
            """
            SELECT
                m.session_id::text,
                COALESCE(
                    (SELECT content FROM messages m2
                     WHERE m2.session_id = m.session_id AND m2.role = 'user'
                     ORDER BY m2.created_at ASC LIMIT 1),
                    'Untitled Chat'
                ) AS title,
                COALESCE(
                    (SELECT agent FROM messages m3
                     WHERE m3.session_id = m.session_id AND m3.agent IS NOT NULL
                     ORDER BY m3.created_at DESC LIMIT 1),
                    'coder'
                ) AS agent,
                MAX(m.created_at) AS last_active
            FROM messages m
            GROUP BY m.session_id
            ORDER BY last_active DESC;
            """
        )
        rows = cur.fetchall()
        cur.close()
        return [
            {
                "session_id": row[0],
                "title": row[1],
                "agent": row[2],
                "created_at": row[3].isoformat() if hasattr(row[3], "isoformat") else str(row[3]),
            }
            for row in rows
        ]
    except Exception as e:
        if conn:
            try:
                conn.rollback()
            except Exception:
                pass
        print(f"[DB ERROR] Could not fetch sessions: {e}")
        return []
    finally:
        if conn:
            conn.close()

def get_messages_by_session(session_id):
    """Fetches all messages for a specific session_id, ordered by created_at ASC."""
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute(
            """
            SELECT id, session_id::text, role, content, agent, model_used, provider, latency_ms, fallback_triggered, created_at
            FROM messages
            WHERE session_id = %s
            ORDER BY created_at ASC;
            """,
            (session_id,)
        )
        rows = cur.fetchall()
        cur.close()
        return [
            {
                "id": str(row[0]),
                "session_id": row[1],
                "role": row[2],
                "content": row[3],
                "agent": row[4],
                "model_used": row[5],
                "provider": row[6],
                "latency_ms": row[7],
                "fallback_triggered": row[8],
                "created_at": row[9].isoformat() if hasattr(row[9], "isoformat") else str(row[9]),
            }
            for row in rows
        ]
    except Exception as e:
        if conn:
            try:
                conn.rollback()
            except Exception:
                pass
        print(f"[DB ERROR] Could not fetch messages for session {session_id}: {e}")
        return []
    finally:
        if conn:
            conn.close()

def delete_session(session_id):
    """Deletes all messages and the session record for a given session_id."""
    conn = None
    cur = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("DELETE FROM messages WHERE session_id = %s", (session_id,))
        cur.execute("DELETE FROM sessions WHERE id = %s", (session_id,))
        conn.commit()
    except Exception as e:
        if conn:
            try:
                conn.rollback()
            except Exception:
                pass
        print(f"[DB ERROR] Could not delete session {session_id}: {e}")
        raise
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()
