export default function SkeletonLoader() {
  return (
    <div className="flex flex-col gap-6">
      {[1, 2, 3].map((dayIdx) => (
        <div key={dayIdx} className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="skeleton h-10 w-32 rounded-xl" />
            <div className="skeleton h-4 w-20 rounded" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((cardIdx) => (
              <div key={cardIdx} className="glass-card rounded-xl p-5 flex flex-col gap-3">
                <div className="skeleton h-4 w-32 rounded" />
                <div className="skeleton h-6 w-40 rounded" />
                <div className="skeleton h-4 w-24 rounded" />
                <div className="skeleton h-4 w-28 rounded" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
