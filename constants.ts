export const SYSTEM_INSTRUCTIONS = {
  TRANSCRIPTION: "আপনার কাজ হলো অডিও থেকে হুবহু বাংলা শব্দগুলো লিখে দেওয়া। কোনো ইংরেজি শব্দ বা অক্ষর লিখবেন না।\n\nবিশেষ নির্দেশনা:\nযদি অডিওতে কোনো আরবি কোরআনের আয়াত বা হাদিস থাকে, তবে সেগুলো সুন্দরভাবে আরবি হরফে পূর্ণ হরকতসহ (full diacritical marks/ḥarakāt) লিখুন।\n\nকোটর নিয়মাবলী:\n১. শুধুমাত্র অডিওতে শোনা বাংলা শব্দগুলো লিখুন।\n২. অডিওতে থাকা আরবি আয়াত বা হাদিসগুলো পূর্ণ হরকতসহ আরবি হরফে নির্ভুলভাবে লিখুন।\n৩. কোনো টাইমস্ট্যাম্প (যেমন: 00:01) বা সময় যুক্ত করবেন না।\n৪. কোনো ইংরেজি অক্ষর বা শব্দ ব্যবহার করবেন না।\n৫. কোনো বক্তার নাম বা লেবেল দিবেন না।\n৬. আপনার পক্ষ থেকে কোনো ভূমিকা বা উপসংহার লিখবেন না।\n৭. শুধুমাত্র খাঁটি বাংলা এবং প্রয়োজনীয় ক্ষেত্রে আরবি হরফে শব্দে শব্দে ট্রান্সক্রিপশন প্রদান করুন।",
  
  AI_POLISH: "আপনি একজন দক্ষ বাংলা ভাষা বিশেষজ্ঞ এবং ধর্মীয় টেক্সট এডিটর। আপনার কাছে একটি ট্রান্সক্রাইব করা টেক্সট পাঠানো হচ্ছে। আপনার কাজ হলো একে অত্যন্ত সূক্ষ্মভাবে রিফাইন করা।\n\nকঠোর নিয়মাবলী:\n১. শব্দ ও গঠন: মূল শব্দগুলো হুবহু রাখার চেষ্টা করুন। কোনো নতুন শব্দ বা অতিরিক্ত তথ্য যোগ করবেন না। \n২. ধারাবাহিকতা: কথার সিরিয়াল বা ফ্লো একদম পরিবর্তন করবেন না। বক্তার নিজস্ব বাচনভঙ্গি বজায় রাখুন।\n৩. স্পষ্টতা ও শুদ্ধিকরণ: শুধুমাত্র অস্পষ্ট বা ভুলভাবে লেখা বাক্যগুলোকে ব্যাকরণগতভাবে শুদ্ধ এবং শ্রুতিমধুর করুন। \n৪. পুনরাবৃত্তি বর্জন: যদি কোনো বাক্য বা অংশ বারবার উচ্চারিত হয় (repetition), তবে তা মাত্র একবার মার্জিতভাবে লিখুন।\n৫. ধর্মীয় টেক্সট: কুরআনের আয়াত বা হাদিস যদি ভুলভাবে (ভুল বানান বা ভুল হরকত) লেখা থাকে, তবে সেটির সঠিক ও বিশুদ্ধ রূপটি পূর্ণ হরকতসহ আরবি হরফে লিখে দিন।\n৬. অর্থ সংরক্ষণ: ধর্মীয় টেক্সটের অনুবাদ বা ব্যাখ্যা বক্তা যেভাবে দিয়েছেন, ঠিক সেভাবেই রাখুন; শুধু ভাষাগতভাবে টেক্সটটি পরিষ্কার ও সুন্দর করুন।\n৭. চূড়ান্ত লক্ষ্য: পড়ার সময় যেন মনে হয় এটি মূল বক্তারই কথা, কিন্তু একটি নিখুঁত ও পরিচ্ছন্ন লিখিত রূপ।"
};

export const SUPPORTED_FORMATS = ['audio/mpeg', 'audio/wav', 'audio/x-m4a', 'audio/mp3', 'audio/ogg', 'audio/aac'];

export const TRANSLATIONS = {
  bn: {
    uploadTitle: "অডিও আপলোড করুন",
    uploadSubtitle: "যেকোনো সাইজের ফাইল দ্রুত ট্রান্সক্রাইব হবে",
    browseBtn: "ফাইল বাছুন",
    processing: "প্রসেসিং হচ্ছে...",
    uploading: "ফাইল আপলোড হচ্ছে...",
    starting: "শুরু হচ্ছে...",
    aiWorking: "AI ট্রান্সক্রিপশন শুরু হয়েছে...",
    done: "সম্পন্ন হয়েছে!",
    outputTitle: "আউটপুট",
    newFile: "নতুন ফাইল নিন",
    cancel: "বাতিল",
    start: "শুরু করুন",
    copySuccess: "কপি হয়েছে!",
    errorMsg: "সার্ভারের সাথে সংযোগ বিচ্ছিন্ন হয়েছে। আবার চেষ্টা করুন।",
    noText: "দুঃখিত, কোনো বাংলা কথা পাওয়া যায়নি।",
    retry: "পুনরায় চেষ্টা করুন",
    footer: "Kotha Lipi Transcriber | খাঁটি বাংলা ও আরবি ট্রান্সক্রিপশন",
    archiveTitle: "আর্কাইভ",
    noHistory: "এখনো কোনো হিস্ট্রি নেই",
    clearHistory: "সব মুছুন",
    deleteItem: "মুছুন",
    quickCopy: "কপি করুন",
    aiOutputBtn: "AI আউটপুট",
    originalTab: "মূল টেক্সট",
    aiTab: "AI সংস্করণ",
    polishing: "AI ভাষা গুছিয়ে লিখছে..."
  },
  en: {
    uploadTitle: "Upload Audio",
    uploadSubtitle: "Transcribe files of any size quickly",
    browseBtn: "Browse Files",
    processing: "Processing...",
    uploading: "Uploading file...",
    starting: "Starting...",
    aiWorking: "AI is transcribing...",
    done: "Completed!",
    outputTitle: "Output",
    newFile: "New File",
    cancel: "Cancel",
    start: "Start",
    copySuccess: "Copied!",
    errorMsg: "Connection failed. Please check your internet and retry.",
    noText: "Sorry, no speech detected.",
    retry: "Retry",
    footer: "Kotha Lipi Transcriber | Pure Bengali & Arabic Transcription",
    archiveTitle: "Library",
    noHistory: "No history yet",
    clearHistory: "Clear All",
    deleteItem: "Delete",
    quickCopy: "Copy",
    aiOutputBtn: "AI Output",
    originalTab: "Original",
    aiTab: "AI Enhanced",
    polishing: "AI is polishing text..."
  }
};