import { useEffect, useState } from "react";
import { getHours } from "../api/client";

// { Puja: ["Mon–Wed, Sat · 10AM–6PM"], Sia: ["Thu, Fri · 10AM–6PM"] }
// null = load ho raha hai, {} = load nahi hua
let cache = null;
let inflight = null;

export default function useStaffSchedule() {
  const [sched, setSched] = useState(cache);

  useEffect(() => {
    if (cache) return undefined;
    let alive = true;
    inflight =
      inflight ||
      getHours()
        .then((d) => {
          const m = {};
          (d.staff || []).forEach((s) => { m[s.name] = s.schedule; });
          cache = m;
          return m;
        })
        .finally(() => { inflight = null; });
    inflight.then((m) => alive && setSched(m)).catch(() => alive && setSched({}));
    return () => { alive = false; };
  }, []);

  return sched;
}