const ChatPreview = () => (
  <section className="relative z-10 max-w-2xl mx-auto px-8 pb-32">
    <div className="bg-slate-800 bg-opacity-80 border border-slate-700 rounded-3xl p-6 shadow-2xl">
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-700">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-rose-400 flex items-center justify-center text-lg">
          🌙
        </div>
        <div>
          <p className="text-white font-medium text-sm">Mendi</p>
          <p className="text-green-400 text-xs">● Online</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-start">
          <div className="bg-slate-700 rounded-2xl rounded-tl-sm px-4 py-3 max-w-xs">
            <p className="text-slate-200 text-sm">Good morning Rahul ☀️ How are you feeling today?</p>
            <p className="text-slate-500 text-xs mt-1">8:00 AM</p>
          </div>
        </div>
        <div className="flex justify-end">
          <div className="bg-gradient-to-br from-amber-500 to-rose-500 rounded-2xl rounded-tr-sm px-4 py-3 max-w-xs">
            <p className="text-white text-sm">Pretty anxious... have a big presentation at 2pm 😬</p>
            <p className="text-amber-100 text-xs mt-1 opacity-70">8:03 AM</p>
          </div>
        </div>
        <div className="flex justify-start">
          <div className="bg-slate-700 rounded-2xl rounded-tl-sm px-4 py-3 max-w-xs">
            <p className="text-slate-200 text-sm">
              That sounds nerve-wracking, but I know you've prepared for this. I'll check in
              with you after 2pm to see how it went 💛
            </p>
            <p className="text-slate-500 text-xs mt-1">8:03 AM</p>
          </div>
        </div>
        <div className="flex justify-start opacity-60">
          <div className="bg-slate-700 rounded-2xl rounded-tl-sm px-4 py-3 max-w-xs">
            <p className="text-slate-200 text-sm">
              Hey, your presentation was at 2pm — how did it go? 🤞
            </p>
            <p className="text-slate-500 text-xs mt-1">4:00 PM</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 mt-6 pt-4 border-t border-slate-700">
        <div className="flex-1 bg-slate-700 rounded-full px-4 py-2 text-slate-500 text-sm">
          Type how you're feeling...
        </div>
        <button className="w-10 h-10 bg-gradient-to-br from-amber-400 to-rose-400 rounded-full flex items-center justify-center text-slate-900 font-bold">
          →
        </button>
      </div>
    </div>
  </section>
);

export default ChatPreview;