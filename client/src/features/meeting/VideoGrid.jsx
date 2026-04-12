function VideoGrid() {
  return (
    <div className="grid flex-1 grid-cols-2 gap-4 p-4">
      <div className="flex h-64 items-center justify-center rounded-lg border-5 border-dashed border-black bg-gray-300">
        Video 1
      </div>

      <div className="flex h-64 items-center justify-center rounded-lg border-5 border-dashed border-black bg-gray-300 ">
        Video 2
      </div>

      <div className="flex h-64 items-center justify-center rounded-lg border-5 border-dashed border-black bg-gray-300 ">
        Video 3
      </div>

      <div className="flex h-64 items-center justify-center rounded-lg border-5 border-dashed border-black bg-gray-300 ">
        Video 4
      </div>
    </div>
  );
}

export default VideoGrid;