import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const config = window.MIDNIGHT_CONFIG ?? {};
const configured =
  typeof config.supabaseUrl === "string" &&
  config.supabaseUrl.startsWith("https://") &&
  !config.supabaseUrl.includes("PASTE_") &&
  typeof config.supabasePublishableKey === "string" &&
  !config.supabasePublishableKey.includes("PASTE_");

const supabase = configured
  ? createClient(config.supabaseUrl, config.supabasePublishableKey)
  : null;

const sampleStories = [
  {id:-1,title:"十年ぶりに届いた、短いメッセージ",body:"『元気？』たった三文字で、止まっていた時間が動き出した。\n\n返事を打っては消して、結局送ったのは同じ三文字だった。",category:"再会",likes:417,views:2801,created_at:new Date().toISOString()},
  {id:-2,title:"好きと言わないまま、季節だけが変わった",body:"毎日会えることに甘えていた。終わりが来るなんて考えもしなかった。\n\n言えなかった言葉だけが、今もあの日に残っている。",category:"片思い",likes:336,views:2318,created_at:new Date().toISOString()},
  {id:-3,title:"別れたあとで、優しさの意味を知った",body:"あの時は気づけなかった。言葉にならない優しさが、たくさんあった。\n\n失ってからしか見えないものは、たしかにある。",category:"失恋",likes:291,views:1966,created_at:new Date().toISOString()},
  {id:-4,title:"誰にも言えないまま、私はその街を離れた",body:"最後まで秘密にすると決めた。それが二人を守る唯一の方法だった。\n\n電車が動き出すまで、私はただその背中を見ていた。",category:"秘密",likes:608,views:4102,created_at:new Date().toISOString()}
];

let stories = [...sampleStories];
let selectedCategory = "すべて";
let searchTerm = "";
let currentStory = null;

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

function escapeHtml(value = "") {
  return value.replace(/[&<>"']/g, char => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[char]));
}

function getLocalLikes(id) {
  try { return Number(localStorage.getItem(`ml-like-${id}`) ?? 0); }
  catch { return 0; }
}

function render() {
  const filtered = stories.filter(story => {
    const categoryOk = selectedCategory === "すべて" || story.category === selectedCategory;
    const text = `${story.title} ${story.body}`.toLowerCase();
    return categoryOk && text.includes(searchTerm.toLowerCase());
  });

  $("#storyGrid").innerHTML = filtered.map(story => `
    <article class="story-card" data-id="${story.id}">
      <span class="story-category">${escapeHtml(story.category ?? "秘密")}</span>
      <h3>${escapeHtml(story.title)}</h3>
      <p>${escapeHtml(story.body).replace(/\n/g," ").slice(0,115)}${story.body.length>115?"…":""}</p>
      <div class="story-meta"><span>${new Date(story.created_at).toLocaleDateString("ja-JP")}</span><span>♡ ${(story.likes ?? 0)+getLocalLikes(story.id)}</span></div>
    </article>
  `).join("");

  $("#emptyState").classList.toggle("hidden", filtered.length > 0);

  $$(".story-card").forEach(card => {
    card.addEventListener("click", () => {
      currentStory = stories.find(story => String(story.id) === card.dataset.id);
      openStory(currentStory);
    });
  });

  const ranked = [...stories].sort((a,b) =>
    ((b.likes ?? 0)+(b.views ?? 0)/10) - ((a.likes ?? 0)+(a.views ?? 0)/10)
  ).slice(0,5);

  $("#rankingList").innerHTML = ranked.map((story,index) => `
    <button class="rank-row" data-id="${story.id}">
      <b>0${index+1}</b>
      <span><strong>${escapeHtml(story.title)}</strong><small>${escapeHtml(story.category ?? "秘密")}</small></span>
      <em>${(story.views ?? 0).toLocaleString()} views</em>
    </button>
  `).join("");

  $$(".rank-row").forEach(row => row.addEventListener("click", () => {
    currentStory = stories.find(story => String(story.id) === row.dataset.id);
    openStory(currentStory);
  }));
}

function openStory(story) {
  if (!story) return;
  $("#modalCategory").textContent = story.category ?? "秘密";
  $("#modalTitle").textContent = story.title;
  $("#modalBody").innerHTML = story.body.split(/\n\n+/).map(p => `<p>${escapeHtml(p)}</p>`).join("");
  $("#modalLikes").textContent = (story.likes ?? 0) + getLocalLikes(story.id);
  $("#storyModal").classList.remove("hidden");
  document.body.style.overflow = "hidden";
}

function closeStory() {
  $("#storyModal").classList.add("hidden");
  document.body.style.overflow = "";
}

async function loadPublishedStories() {
  if (!supabase) {
    $("#connectionNotice").textContent = "現在は接続前のプレビュー表示です。config.jsにSupabase情報を入れると、本物の投稿が表示されます。";
    $("#connectionNotice").classList.remove("hidden");
    render();
    return;
  }

  const { data, error } = await supabase
    .from("stories")
    .select("id,title,body,category,likes,views,created_at")
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    $("#connectionNotice").textContent = `Supabaseから読み込めませんでした：${error.message}`;
    $("#connectionNotice").classList.remove("hidden");
    render();
    return;
  }

  stories = data?.length ? data : sampleStories;
  render();
}

$("#storyForm").addEventListener("submit", async event => {
  event.preventDefault();
  const status = $("#formStatus");

  if (!supabase) {
    status.textContent = "先にconfig.jsへSupabaseのProject URLとPublishable keyを設定してください。";
    return;
  }

  const form = new FormData(event.currentTarget);
  const title = String(form.get("title") ?? "").trim();
  const category = String(form.get("category") ?? "秘密");
  const body = String(form.get("body") ?? "").trim();

  if (title.length < 3 || body.length < 20) {
    status.textContent = "タイトルは3文字以上、本文は20文字以上で入力してください。";
    return;
  }

  $("#submitButton").disabled = true;
  $("#submitButton").textContent = "送信中…";
  status.textContent = "";

  const { error } = await supabase.from("stories").insert({
    title,
    category,
    body,
    status: "pending"
  });

  $("#submitButton").disabled = false;
  $("#submitButton").textContent = "封筒に入れて送る";

  if (error) {
    status.textContent = `送信できませんでした：${error.message}`;
    return;
  }

  event.currentTarget.reset();
  $("#charCount").textContent = "0 / 1500";
  status.textContent = "手紙を受け取りました。確認後に掲載されます。";
});

$("#bodyInput").addEventListener("input", event => {
  $("#charCount").textContent = `${event.target.value.length} / 1500`;
});

$("#filters").addEventListener("click", event => {
  const button = event.target.closest("button");
  if (!button) return;
  selectedCategory = button.dataset.category;
  $$("#filters button").forEach(item => item.classList.toggle("active", item === button));
  render();
});

$("#searchInput").addEventListener("input", event => {
  searchTerm = event.target.value.trim();
  render();
});

$("#enterButton").addEventListener("click", () => {
  try { localStorage.setItem("ml-age-ok","1"); } catch {}
  $("#ageGate").classList.add("hidden");
});

try {
  if (localStorage.getItem("ml-age-ok") === "1") $("#ageGate").classList.add("hidden");
} catch {}

$("#modalClose").addEventListener("click", closeStory);
$(".modal-bg").addEventListener("click", closeStory);

$("#localLikeButton").addEventListener("click", () => {
  if (!currentStory) return;
  const current = getLocalLikes(currentStory.id);
  if (current > 0) return;
  try { localStorage.setItem(`ml-like-${currentStory.id}`,"1"); } catch {}
  $("#modalLikes").textContent = (currentStory.likes ?? 0) + 1;
  render();
});

loadPublishedStories();
