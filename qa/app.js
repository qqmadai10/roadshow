const STORAGE_KEY = "institutional-qa-prototype-v1";
const DEMO = [
  { id: "demo-1", client: "华东某银行理财子（演示）", meeting: "固收+产品交流（演示）", date: "2026-09-18", owner: "示例销售", question: "出现净值回撤时，销售应提供哪些归因材料？", answer: "先确认客户关注的观察区间与回撤口径，再提供该产品同期净值、定期报告中可核实的持仓或策略信息，并明确区分已披露事实与待基金经理确认的归因。不要承诺回撤修复时间。", source: "演示口径：正式使用时须替换为基金定期报告、净值来源和内部审核文档", tags: ["回撤", "归因", "固收+"], status: "approved", version: 1, demo: true, approvedAt: "2026-09-19" },
  { id: "demo-2", client: "华东某银行理财子（演示）", meeting: "固收+产品交流（演示）", date: "2026-09-18", owner: "示例销售", question: "怎么确认机构投资者占比和资金稳定性？", answer: "机构持有人占比应以产品年报或半年报披露的数据为准，并标注报告期。持有人结构不能直接等同于资金稳定性；还需要向客户核实配置期限、赎回安排和集中度约束。", source: "演示口径：正式使用时须附基金年报或半年报的具体页码", tags: ["机构占比", "持有人", "资金稳定性"], status: "approved", version: 1, demo: true, approvedAt: "2026-09-19" },
  { id: "demo-3", client: "某保险资管（演示）", meeting: "权益策略沟通（演示）", date: "2026-09-25", owner: "示例销售", question: "怎样判断基金经理的投资风格是否稳定？", answer: "可把经理公开阐述的投资框架，与多个报告期的持仓、行业暴露和业绩归因放在一起比较；先对齐客户考核周期，再讨论风格变化是否来自主动决策。单一期业绩不能证明风格稳定。", source: "演示口径：正式使用时须附定期报告及经理公开访谈出处", tags: ["权益", "风格稳定性", "基金经理"], status: "approved", version: 1, demo: true, approvedAt: "2026-09-26" },
  { id: "demo-4", client: "某保险资管（演示）", meeting: "权益策略沟通（演示）", date: "2026-09-25", owner: "示例销售", question: "产品规模变大后，策略容量如何评估？", answer: "待补充：需要结合持仓流动性、换手率与组合集中度讨论，具体阈值须由投研和合规共同确认。", source: "待补充正式来源", tags: ["规模容量", "流动性"], status: "draft", version: 1, demo: true }
];

function loadRecords() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    return Array.isArray(saved) ? saved : structuredClone(DEMO);
  } catch { return structuredClone(DEMO); }
}
let records = loadRecords();
let currentView = "ask";
let editingId = null;
let practiceIndex = -1;
let practiceRecord = null;
const byId = id => document.getElementById(id);
const unique = values => [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b, "zh-CN"));

function save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(records)); }
function toast(message) {
  const element = byId("toast");
  element.textContent = message;
  element.classList.add("visible");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => element.classList.remove("visible"), 2600);
}
function el(tag, className, value) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (value !== undefined) node.textContent = String(value);
  return node;
}
function labelSource(container, source) {
  if (/^https:\/\//i.test(source)) {
    const link = el("a", "", source);
    link.href = source;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    container.append(link);
  } else container.append(document.createTextNode(source));
}
function statusText(status) { return ({ approved: "已审核", draft: "待审核", rejected: "已退回" })[status] || status; }
function showView(view) {
  currentView = view;
  document.querySelectorAll(".view").forEach(node => node.classList.toggle("active", node.id === `${view}View`));
  document.querySelectorAll(".nav-item").forEach(node => node.classList.toggle("active", node.dataset.view === view));
  if (view === "ask") renderAsk();
  if (view === "capture") renderDatalists();
  if (view === "review") renderReview();
  if (view === "library") renderLibrary();
}
document.querySelectorAll(".nav-item").forEach(button => button.addEventListener("click", () => showView(button.dataset.view)));

function setOptions(select, options, allLabel, previous) {
  select.replaceChildren();
  select.add(new Option(allLabel, "all"));
  options.forEach(value => select.add(new Option(value, value)));
  select.value = options.includes(previous) ? previous : "all";
}
function renderAskSelectors() {
  const clientSelect = byId("askClient");
  const meetingSelect = byId("askMeeting");
  const client = clientSelect.value || "all";
  const meeting = meetingSelect.value || "all";
  const approved = records.filter(record => record.status === "approved");
  setOptions(clientSelect, unique(approved.map(record => record.client)), "全部客户", client);
  const scoped = approved.filter(record => clientSelect.value === "all" || record.client === clientSelect.value);
  setOptions(meetingSelect, unique(scoped.map(record => record.meeting)), "全部场次", meeting);
}
function scopedApproved() {
  return records.filter(record => record.status === "approved"
    && (byId("askClient").value === "all" || record.client === byId("askClient").value)
    && (byId("askMeeting").value === "all" || record.meeting === byId("askMeeting").value));
}
function renderAsk() {
  renderAskSelectors();
  const matches = scopedApproved().sort((a, b) => b.date.localeCompare(a.date));
  byId("contextCount").textContent = `${matches.length} 条`;
  const list = byId("contextQuestions");
  list.replaceChildren();
  if (!matches.length) list.append(el("p", "empty", "当前范围还没有已审核问答。"));
  matches.forEach(record => {
    const button = el("button", "context-question", record.question);
    button.type = "button";
    button.append(el("small", "", `${record.client} · ${record.meeting} · ${record.date}`));
    button.addEventListener("click", () => { byId("askInput").value = record.question; byId("askInput").focus(); });
    list.append(button);
  });
}
byId("askClient").addEventListener("change", () => { byId("askMeeting").value = "all"; renderAsk(); clearChat(); practiceIndex = -1; nextPractice(); });
byId("askMeeting").addEventListener("change", () => { renderAsk(); clearChat(); practiceIndex = -1; nextPractice(); });

function setMode(mode) {
  const practice = mode === "practice";
  byId("lookupPanel").hidden = practice;
  byId("practicePanel").hidden = !practice;
  for (const [id, selected] of [["lookupMode", !practice], ["practiceMode", practice]]) {
    byId(id).classList.toggle("active", selected);
    byId(id).setAttribute("aria-selected", String(selected));
  }
  if (practice && !practiceRecord) nextPractice();
}
function nextPractice() {
  const pool = scopedApproved().sort((a, b) => a.id.localeCompare(b.id));
  practiceIndex = pool.length ? (practiceIndex + 1) % pool.length : -1;
  practiceRecord = practiceIndex < 0 ? null : pool[practiceIndex];
  byId("practiceQuestion").textContent = practiceRecord?.question || "当前范围还没有已审核问题";
  byId("practiceMeta").textContent = practiceRecord ? `${practiceRecord.client} · ${practiceRecord.meeting} · ${practiceRecord.date}` : "请切换客户或场次，也可以先录入并审核问答。";
  byId("practiceAnswer").value = "";
  byId("practiceAnswer").disabled = !practiceRecord;
  byId("showAnswer").disabled = !practiceRecord;
  byId("practiceFeedback").hidden = true;
  byId("practiceFeedback").replaceChildren();
}
byId("lookupMode").addEventListener("click", () => setMode("lookup"));
byId("practiceMode").addEventListener("click", () => setMode("practice"));
byId("nextQuestion").addEventListener("click", nextPractice);
byId("showAnswer").addEventListener("click", () => {
  if (!practiceRecord) return;
  if (!byId("practiceAnswer").value.trim()) { toast("先写下你的回答，再对照标准答案"); return; }
  const panel = byId("practiceFeedback");
  panel.replaceChildren();
  panel.append(el("h3", "", "已审核标准答案"), el("p", "", practiceRecord.answer));
  const citation = el("div", "reference", `来源：${practiceRecord.client} · ${practiceRecord.meeting} · 第 ${practiceRecord.version} 版\n依据：`);
  labelSource(citation, practiceRecord.source);
  panel.append(citation);
  panel.hidden = false;
});

function message(kind, body, record) {
  const box = el("div", `message ${kind}`);
  box.append(el("span", "message-label", kind === "user" ? "你" : "已审核知识库"));
  box.append(document.createTextNode(body));
  if (record) {
    const citation = el("div", "reference", `来源：${record.client} · ${record.meeting} · ${record.date} · 第 ${record.version} 版 · ${record.approvedAt || "已审核"}\n依据：`);
    labelSource(citation, record.source);
    box.append(citation);
  }
  const messages = byId("chatMessages");
  messages.append(box);
  messages.scrollTop = messages.scrollHeight;
}
function clearChat() {
  byId("chatMessages").replaceChildren();
  message("answer", "选定客户和路演场次后，问我一个具体问题。我只会呈现该范围内已审核的标准答案；没有命中就明确说不知道。", null);
}
function bigrams(text) {
  const clean = String(text).toLowerCase().replace(/[\s，。！？、：；（）()“”"'.,!?;:]/g, "");
  const out = new Set();
  for (let i = 0; i < clean.length - 1; i++) out.add(clean.slice(i, i + 2));
  return [...out];
}
function score(query, record) {
  const q = String(query).trim().toLowerCase();
  const target = `${record.question} ${record.tags.join(" ")} ${record.answer}`.toLowerCase();
  let result = target.includes(q) ? 12 : 0;
  for (const pair of bigrams(q)) if (target.includes(pair)) result += 1;
  if (record.question.toLowerCase() === q) result += 20;
  return result;
}
byId("askForm").addEventListener("submit", event => {
  event.preventDefault();
  const input = byId("askInput");
  const query = input.value.trim();
  if (!query) return;
  message("user", query);
  const ranked = scopedApproved().map(record => ({ record, points: score(query, record) })).sort((a, b) => b.points - a.points);
  const best = ranked[0];
  if (best && best.points >= 2) message("answer", `找到最相关的已审核标准答案：\n${best.record.answer}`, best.record);
  else message("answer", "当前客户与场次下，没有找到可核实的已审核答案。请向客户或投研确认后，在“路演后入库”提交问答，审核通过后再供团队使用。", null);
  input.value = "";
});

function renderDatalists() {
  const clients = byId("clientOptions");
  const meetings = byId("meetingOptions");
  clients.replaceChildren(); meetings.replaceChildren();
  unique(records.map(record => record.client)).forEach(value => clients.append(new Option(value)));
  unique(records.map(record => record.meeting)).forEach(value => meetings.append(new Option(value)));
}
function formValue(form, name) { return String(new FormData(form).get(name) || "").trim(); }
function validRecord(record) {
  const date = typeof record.date === "string" ? new Date(`${record.date}T00:00:00Z`) : new Date(NaN);
  return ["client", "meeting", "date", "owner", "question", "answer", "source"].every(key => typeof record[key] === "string" && record[key].trim())
    && /^\d{4}-\d{2}-\d{2}$/.test(record.date)
    && !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === record.date;
}
function duplicateOf(record) {
  return records.find(item => item.id !== editingId && item.client === record.client && item.meeting === record.meeting && item.question.trim() === record.question.trim());
}
function formToRecord(form) {
  return {
    client: formValue(form, "client"), meeting: formValue(form, "meeting"), date: formValue(form, "date"),
    owner: formValue(form, "owner"), question: formValue(form, "question"), answer: formValue(form, "answer"),
    source: formValue(form, "source"), tags: formValue(form, "tags").split(/[,，、]/).map(value => value.trim()).filter(Boolean)
  };
}
byId("captureForm").addEventListener("submit", event => {
  event.preventDefault();
  const form = event.currentTarget;
  if (!form.reportValidity()) return;
  const draft = formToRecord(form);
  if (!validRecord(draft)) { toast("请补齐必填信息和有效日期"); return; }
  if (duplicateOf(draft) && !confirm("同一客户、场次下已有相同问题。仍要保存为新记录吗？")) return;
  if (editingId) {
    const current = records.find(record => record.id === editingId);
    current.history ||= [];
    current.history.push({ version: current.version, answer: current.answer, source: current.source, status: current.status });
    Object.assign(current, draft, { status: "draft", version: current.version + 1, approvedAt: null });
    toast("修订已保存，等待重新审核");
  } else {
    records.unshift({ ...draft, id: crypto.randomUUID(), status: "draft", version: 1, createdAt: new Date().toISOString(), demo: false });
    toast("问答已保存到待审核队列");
  }
  editingId = null;
  form.reset();
  byId("formHeading").textContent = "新增问答";
  byId("cancelEdit").hidden = true;
  save(); refresh();
});
byId("cancelEdit").addEventListener("click", () => { editingId = null; byId("captureForm").reset(); byId("formHeading").textContent = "新增问答"; byId("cancelEdit").hidden = true; });
function editRecord(id) {
  const record = records.find(item => item.id === id);
  if (!record) return;
  editingId = id;
  const form = byId("captureForm");
  for (const name of ["client", "meeting", "date", "owner", "question", "answer", "source"]) form.elements[name].value = record[name];
  form.elements.tags.value = record.tags.join(", ");
  byId("formHeading").textContent = `修订问答 · 第 ${record.version + 1} 版`;
  byId("cancelEdit").hidden = false;
  showView("capture");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function recordNode(record, reviewMode) {
  const article = el("article", "record");
  const top = el("div", "record-top");
  top.append(el("span", "record-client", record.client));
  top.append(el("span", `status ${record.status}`, statusText(record.status)));
  article.append(top);
  article.append(el("div", "record-meta", `${record.meeting} · ${record.date} · 记录人 ${record.owner} · 第 ${record.version} 版${record.demo ? " · 虚构演示" : ""}`));
  article.append(el("h3", "", record.question));
  article.append(el("p", "record-answer", record.answer));
  const source = el("div", "record-source", "依据："); labelSource(source, record.source); article.append(source);
  if (record.tags.length) {
    const tags = el("div", "record-meta");
    record.tags.forEach(tag => tags.append(el("span", "tag", tag)));
    article.append(tags);
  }
  if (record.history?.length) {
    const details = el("details", "");
    details.append(el("summary", "", `查看 ${record.history.length} 个历史版本`));
    record.history.forEach(version => details.append(el("p", "", `第 ${version.version} 版（${statusText(version.status)}）\n${version.answer}\n依据：${version.source}`)));
    article.append(details);
  }
  const actions = el("div", "record-actions");
  const edit = el("button", "", "修订"); edit.type = "button"; edit.addEventListener("click", () => editRecord(record.id)); actions.append(edit);
  if (reviewMode) {
    const approve = el("button", "approve", "审核通过"); approve.type = "button";
    approve.addEventListener("click", () => {
      if (/待补充|待核实/.test(`${record.answer} ${record.source}`)) { toast("答案或依据仍待补充，请先修订"); return; }
      record.status = "approved"; record.approvedAt = new Date().toISOString().slice(0, 10);
      save(); refresh(); toast("已进入可检索知识库");
    });
    const reject = el("button", "", "退回补充"); reject.type = "button";
    reject.addEventListener("click", () => { record.status = "rejected"; save(); refresh(); toast("已退回，修订后可再次提交"); });
    actions.append(approve, reject);
  }
  article.append(actions);
  return article;
}
function renderReview() {
  const list = byId("reviewList"); list.replaceChildren();
  const pending = records.filter(record => record.status === "draft");
  if (!pending.length) list.append(el("p", "empty", "暂无待审核问答。新录入或导入的记录会显示在这里。"));
  pending.forEach(record => list.append(recordNode(record, true)));
}
function renderLibrary() {
  const list = byId("libraryList"); list.replaceChildren();
  const query = byId("librarySearch").value.trim().toLowerCase();
  const status = byId("libraryStatus").value;
  const filtered = records.filter(record => (status === "all" || record.status === status)
    && (!query || `${record.client} ${record.meeting} ${record.question} ${record.answer} ${record.tags.join(" ")}`.toLowerCase().includes(query)));
  if (!filtered.length) list.append(el("p", "empty", "没有符合条件的问答记录。"));
  filtered.forEach(record => list.append(recordNode(record, false)));
}
byId("librarySearch").addEventListener("input", renderLibrary);
byId("libraryStatus").addEventListener("change", renderLibrary);

byId("importInput").addEventListener("change", async event => {
  const file = event.target.files?.[0];
  event.target.value = "";
  if (!file) return;
  if (file.size > 2_000_000) { toast("文件超过 2 MB，请拆分导入"); return; }
  try {
    const parsed = JSON.parse(await file.text());
    const entries = Array.isArray(parsed) ? parsed : parsed.records;
    if (!Array.isArray(entries) || entries.length > 100 || !entries.every(validRecord)) throw new Error("格式或必填字段不符合要求");
    const imported = entries.map(item => ({
      id: crypto.randomUUID(), client: item.client.trim(), meeting: item.meeting.trim(), date: item.date,
      owner: item.owner.trim(), question: item.question.trim(), answer: item.answer.trim(), source: item.source.trim(),
      tags: Array.isArray(item.tags) ? item.tags.map(String).slice(0, 12) : [], status: "draft", version: 1,
      createdAt: new Date().toISOString(), demo: false
    }));
    records = [...imported, ...records];
    save(); refresh(); toast(`已导入 ${imported.length} 条，等待审核`);
  } catch (error) { toast(`导入失败：${error.message}`); }
});
byId("exportButton").addEventListener("click", () => {
  if (!confirm("导出的 JSON 可能包含客户问答信息。请确认下载到受控位置。")) return;
  const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), records }, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a"); link.href = url; link.download = "机构客户问答库-本地备份.json"; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});
function refresh() {
  byId("pendingCount").textContent = records.filter(record => record.status === "draft").length;
  renderAsk(); renderDatalists(); renderReview(); renderLibrary();
  if (practiceRecord && !scopedApproved().some(record => record.id === practiceRecord.id)) { practiceIndex = -1; nextPractice(); }
}
refresh(); clearChat();

