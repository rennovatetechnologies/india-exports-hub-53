import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import EventLanding from "@/components/EventLanding";
import FallbackScreen from "@/components/FallbackScreen";
import { fetchEvent } from "@/lib/eventsCatalog";
import { PATHS } from "@/lib/routes";

export default function EventDetailPage() {
  const { eventId } = useParams();
  const [event, setEvent] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setReady(false);
    fetchEvent(eventId)
      .then((found) => {
        if (!cancelled) {
          setEvent(found);
          setReady(true);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setEvent(null);
          setReady(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [eventId]);

  useEffect(() => {
    if (!event?.title) return;
    const prev = document.title;
    document.title = `${event.title} | Virastra by New India Export`;
    return () => {
      document.title = prev;
    };
  }, [event?.title]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center pt-24 text-sm text-white/50">
        Loading event…
      </div>
    );
  }

  if (!event) {
    return (
      <div className="px-5 pb-24 pt-28">
        <FallbackScreen
          kind="not-found"
          title="We couldn't find that event"
          message="That event is not published, or the link is out of date."
        />
        <div className="mt-6 text-center">
          <Link to={PATHS.events} className="btn-gold inline-flex rounded-full px-5 py-2.5 text-sm font-semibold">
            Browse events
          </Link>
        </div>
      </div>
    );
  }

  return <EventLanding event={event} />;
}
