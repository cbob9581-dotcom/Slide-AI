export function Skeleton() {
  return (
    <div className="animate-pulse space-y-3 p-4">
      <div className="h-4 bg-gray-800 rounded w-3/4" />
      <div className="h-3 bg-gray-800 rounded w-full" />
      <div className="h-3 bg-gray-800 rounded w-5/6" />
      <div className="h-3 bg-gray-800 rounded w-2/3" />
      <div className="h-4 bg-gray-800 rounded w-1/2 mt-6" />
      <div className="h-3 bg-gray-800 rounded w-full" />
      <div className="h-3 bg-gray-800 rounded w-3/4" />
    </div>
  );
}

export function BlinkCursor() {
  return (
    <span className="inline-block w-0.5 h-5 bg-blue-400 ml-0.5 align-text-bottom animate-pulse" />
  );
}

export function Spinner() {
  return (
    <div className="flex items-center justify-center p-4">
      <div className="w-5 h-5 border-2 border-gray-600 border-t-blue-400 rounded-full animate-spin" />
    </div>
  );
}
