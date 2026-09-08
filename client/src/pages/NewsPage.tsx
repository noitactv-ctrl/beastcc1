import { useQuery } from "@tanstack/react-query";

export default function NewsPage() {
  const { data: announcements = [], isLoading } = useQuery<any[]>({ queryKey: ["/api/announcements"] });
  return (
    <div className="store-page">
      <div className="store-card">
        <div className="store-card-title">Home</div>
        <div className="p-4 sm:p-5">
          <h1 className="text-center text-lg font-semibold text-[#5d6072]">News</h1>
          <p className="mt-2 text-center text-xs text-[#9a9cab]">The latest updates from the marketplace.</p>
          <div className="mt-5 space-y-2">
            {isLoading ? <p className="py-5 text-center text-xs text-[#a1a3b0]">Loading...</p> : announcements.length === 0 ? <p className="py-5 text-center text-xs text-[#a1a3b0]">No news yet.</p> : announcements.map((item: any) => (
              <article key={item.id} className="border border-[#eff0f5] bg-[#fbfbfd] p-3">
                <h2 className="text-sm font-semibold text-[#5c42c8]">{item.title}</h2>
                <p className="mt-2 whitespace-pre-wrap text-xs leading-5 text-[#858798]">{item.body}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}