const STORAGE_KEY = "fund-roadshow-ad-v1";
const DEFAULT = {
  company: "永赢基金",
  code: "014088",
  product: "永赢稳健增强债券型证券投资基金A",
  strategy: "债券增强策略",
  date: "2026年10月8日",
  time: "15:00",
  period: "2026年1月1日～2026年10月1日",
  features: "债券资产配置比例不低于基金资产的80%。在控制组合风险的前提下，运用债券、股票及可转债等工具，力争超越业绩比较基准。债券打底、权益增强，净值仍会随股债市场波动。",
  cumulative: "0.52%",
  annualized: "0.71%",
  volatility: "7.05%",
  drawdown: "4.58%",
  ranking: "待补充",
  navDate: "2026-09-30",
  productDate: "2026-05-30",
  managerDate: "2026-03-31",
  performanceNote: "实际净值：2026-01-05至2026-09-30；年化折算仅为数学换算。",
  managerCount: "2",
  managers: [
    { name: "高楠", features: "首席权益投资官，证券相关从业15年。2023-12-28起管理本基金；公开履历与策略资料显示更侧重权益基本面选股。" },
    { name: "余国豪", features: "固定收益投资部基金经理，证券相关从业10年。2024-05-30起管理本基金；公开策略资料显示关注信用票息与利率波段。" }
  ],
  productSource: "https://pdf.dfcfw.com/pdf/H2_AN202605301823072137_1.pdf",
  managerSource: "https://pdf.dfcfw.com/pdf/H2_AN202604221821399422_1.pdf",
  navSource: "https://fundf10.eastmoney.com/jjjz_014088.html",
  verified: true
};

const saved = (() => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "null"); }
  catch { return null; }
})();
let state = saved && Array.isArray(saved.managers)
  ? { ...structuredClone(DEFAULT), ...saved, managers: saved.managers }
  : structuredClone(DEFAULT);
state.customMedia ||= { logo: false, managers: [false, false] };
if (state.customMedia.logo || state.customMedia.managers.some(Boolean)) state.verified = false;

const images = { logo: null, managers: [null, null] };
let logoUploaded = false;
const defaultPhotoSources = [
  { src: "assets/gao-nan-source.jpg", crop: [18, 24, 210, 350] },
  { src: "assets/yu-guohao-source.jpg", crop: [16, 27, 214, 326] }
];
const canvas = document.getElementById("posterCanvas");
const ctx = canvas.getContext("2d");
const form = document.getElementById("adForm");
const managerFields = document.getElementById("managerFields");
const status = document.getElementById("verificationStatus");
const verifiedCheck = document.getElementById("verifiedCheck");
const copyTextNode = document.getElementById("copyText");
const copyButton = document.getElementById("copyButton");
const downloadButton = document.getElementById("downloadButton");
const toast = document.getElementById("toast");

function loadImage(url, onReady) {
  const image = new Image();
  image.onload = () => { onReady(image); renderAll(); };
  image.src = url;
}
loadImage("assets/yongying-logo.png", image => { images.logo = image; });
defaultPhotoSources.forEach((item, index) => {
  loadImage(item.src, image => { images.managers[index] = { image, crop: item.crop }; });
});

function persist() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function showToast(message) {
  toast.textContent = message;
  toast.classList.add("visible");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("visible"), 2400);
}

function makeField(label, value, managerIndex, field, multiline = false) {
  const wrapper = document.createElement("label");
  wrapper.className = "field";
  const caption = document.createElement("span");
  caption.textContent = label;
  const input = document.createElement(multiline ? "textarea" : "input");
  input.value = value || "";
  input.dataset.managerIndex = managerIndex;
  input.dataset.managerField = field;
  if (multiline) { input.rows = 4; input.maxLength = 120; }
  else input.maxLength = 24;
  wrapper.append(caption, input);
  return wrapper;
}

function renderManagerFields() {
  managerFields.replaceChildren();
  const count = Number(state.managerCount);
  for (let index = 0; index < count; index++) {
    const entry = document.createElement("div");
    entry.className = "manager-entry";
    const heading = document.createElement("h3");
    heading.textContent = `基金经理 ${index + 1}`;
    entry.append(
      heading,
      makeField("姓名", state.managers[index]?.name, index, "name"),
      makeField("个人特点与证据边界", state.managers[index]?.features, index, "features", true)
    );
    const photoField = document.createElement("label");
    photoField.className = "field";
    const photoCaption = document.createElement("span");
    photoCaption.textContent = "官方照片";
    const photoInput = document.createElement("input");
    photoInput.type = "file";
    photoInput.accept = "image/png,image/jpeg,image/webp";
    photoInput.dataset.photoIndex = index;
    photoField.append(photoCaption, photoInput);
    entry.append(photoField);
    managerFields.append(entry);
  }
}

function fillForm() {
  form.querySelectorAll("[data-field]").forEach(input => {
    input.value = state[input.dataset.field] ?? "";
  });
  verifiedCheck.checked = Boolean(state.verified);
  renderManagerFields();
  renderAll();
}

function formatText() {
  const names = state.managers.slice(0, Number(state.managerCount)).map(item => item.name).join("、");
  const managerLines = state.managers.slice(0, Number(state.managerCount))
    .map(item => `${item.name}：${item.features}`).join("\n");
  const prefix = state.verified ? "" : "【待核验草稿】\n";
  return `${prefix}[庆祝][庆祝][庆祝]${state.strategy}路演，欢迎关注！\n` +
    `[庆祝]1.${state.company}-${state.product}（${state.code}）-${names}\n` +
    `[發]时间：${state.date} ${state.time}\n` +
    `[發]产品特征：${state.features}\n` +
    `[發]业绩表现：区间累计收益${state.cumulative}，区间年化折算收益${state.annualized}；年化波动率${state.volatility}，最大回撤${state.drawdown}。同类排名${state.ranking || "待补充"}。（数据统计区间：${state.period}；净值截至${state.navDate}。${state.performanceNote}）\n` +
    `[發]投资经理特点：\n${managerLines}\n\n` +
    `风险提示：过往业绩不预示未来表现，基金有风险，投资需谨慎。本材料仅供路演信息交流，不构成投资建议或收益承诺。`;
}

function font(size, weight = 400) {
  return `${weight} ${size}px "Microsoft YaHei", "PingFang SC", "Noto Sans CJK SC", sans-serif`;
}
function text(value, x, y, size, color, weight = 400) {
  ctx.font = font(size, weight);
  ctx.fillStyle = color;
  ctx.fillText(String(value), x, y);
}
function rounded(x, y, w, h, radius, fill, stroke = null) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, radius);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1.5; ctx.stroke(); }
}
function wrap(value, maxWidth, size, weight) {
  ctx.font = font(size, weight);
  const result = [];
  for (const paragraph of String(value).split("\n")) {
    let line = "";
    for (const char of paragraph) {
      if (line && ctx.measureText(line + char).width > maxWidth) {
        result.push(line);
        line = char;
      } else line += char;
    }
    result.push(line);
  }
  return result;
}
function fitted(value, x, y, width, height, maxSize, minSize, color, weight = 400, lineRatio = 1.35) {
  let size = maxSize;
  let lines;
  while (size >= minSize) {
    lines = wrap(value, width, size, weight);
    if (lines.length * size * lineRatio <= height) break;
    size -= 1;
  }
  size = Math.max(minSize, size);
  lines = wrap(value, width, size, weight);
  const lineHeight = size * lineRatio;
  const maxLines = Math.max(1, Math.floor(height / lineHeight));
  if (lines.length > maxLines) {
    lines = lines.slice(0, maxLines);
    let last = lines[maxLines - 1];
    ctx.font = font(size, weight);
    while (last && ctx.measureText(last + "…").width > width) last = last.slice(0, -1);
    lines[maxLines - 1] = last + "…";
  }
  ctx.font = font(size, weight);
  ctx.fillStyle = color;
  lines.forEach((line, index) => ctx.fillText(line, x, y + size + index * lineHeight));
}
function drawCroppedImage(item, x, y, w, h) {
  if (!item?.image) return;
  const image = item.image;
  const [sx, sy, sx2, sy2] = item.crop || [0, 0, image.width, image.height];
  const sw = sx2 - sx, sh = sy2 - sy;
  const scale = Math.min(w / sw, h / sh);
  const dw = sw * scale, dh = sh * scale;
  ctx.drawImage(image, sx, sy, sw, sh, x + (w - dw) / 2, y + (h - dh), dw, dh);
}
function section(x, y, w, h, title) {
  rounded(x, y, w, h, 12, "#ffffff", "#f2c9ae");
  rounded(x + 28, y + 27, 8, 33, 4, "#d95a1c");
  text(title, x + 52, y + 54, 24, "#a84218", 700);
}

function renderPoster() {
  const width = canvas.width, height = canvas.height;
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, "#fffefc");
  gradient.addColorStop(1, "#fff2e9");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  if (images.logo && ((state.company === DEFAULT.company && !state.customMedia.logo) || (state.customMedia.logo && logoUploaded))) drawCroppedImage({ image: images.logo }, 64, 38, 282, 76);
  else text(state.company, 64, 90, 30, "#a84218", 700);

  ctx.font = font(21, 700);
  const badgeWidth = Math.min(290, Math.max(160, ctx.measureText(state.strategy).width + 42));
  rounded(1016 - badgeWidth, 46, badgeWidth, 48, 8, "#ffeddf");
  fitted(state.strategy, 1016 - badgeWidth + 20, 54, badgeWidth - 40, 32, 21, 17, "#a84218", 700, 1.1);

  fitted(state.product, 64, 139, 952, 92, 62, 38, "#a84218", 700, 1.12);
  const names = state.managers.slice(0, Number(state.managerCount)).map(item => item.name).join("、");
  fitted(`基金代码  ${state.code}    ·    基金经理  ${names}`, 64, 244, 952, 32, 22, 18, "#746b64");

  rounded(64, 292, 952, 118, 12, "#fff2e8");
  text("路演日期", 96, 337, 18, "#776f69");
  fitted(state.date, 96, 346, 390, 48, 33, 24, "#a84218", 700);
  ctx.strokeStyle = "#efc8ae"; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(520, 314); ctx.lineTo(520, 386); ctx.stroke();
  text("路演时间", 558, 337, 18, "#776f69");
  fitted(state.time, 558, 346, 420, 48, 39, 25, "#d95a1c", 700);

  section(64, 434, 952, 252, "产品特征");
  fitted(state.features, 94, 506, 892, 150, 27, 21, "#342e29", 400, 1.55);

  section(64, 710, 952, 260, "业绩表现");
  const metrics = [
    ["区间累计收益", state.cumulative, "#d95a1c", "#fff0e8"],
    ["年化折算收益", state.annualized, "#705b52", "#f3f0ed"],
    ["年化波动率", state.volatility, "#a84218", "#fbf0eb"],
    ["最大回撤", state.drawdown, "#a84218", "#fbf0eb"]
  ];
  metrics.forEach(([label, value, color, fill], index) => {
    const x = 94 + index * 226;
    rounded(x, 786, 212, 104, 10, fill);
    fitted(label, x + 14, 800, 184, 26, 17, 15, "#6f737e");
    fitted(value, x + 14, 836, 184, 45, 36, 25, color, 700, 1.1);
  });
  const rankNote = state.ranking ? `；同类排名${state.ranking}` : "";
  fitted(`${state.performanceNote}${rankNote}`, 94, 911, 892, 40, 18, 14, "#776f69", 400, 1.25);

  section(64, 994, 952, 254, "投资经理特点");
  const count = Number(state.managerCount);
  if (count === 2) {
    ctx.strokeStyle = "#efc8ae"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(540, 1065); ctx.lineTo(540, 1220); ctx.stroke();
  }
  state.managers.slice(0, count).forEach((manager, index) => {
    const base = count === 2 ? 94 + index * 450 : 94;
    if ((state.company === DEFAULT.company && manager.name === DEFAULT.managers[index].name && !state.customMedia.managers[index]) || (state.customMedia.managers[index] && images.managers[index]?.custom)) {
      drawCroppedImage(images.managers[index], base + 10, 1068, 118, 150);
    }
    text(manager.name, base + 132, 1096, 25, "#a84218", 700);
    fitted(manager.features, base + 132, 1107, count === 2 ? 292 : 740, 115, 20, 16, "#342e29", 400, 1.45);
  });

  fitted(`数据统计区间：${state.period}`, 64, 1267, 952, 28, 19, 16, "#a84218", 700);
  fitted(`资料截至：净值${state.navDate}；经理履历${state.managerDate}；产品资料${state.productDate}`, 64, 1303, 952, 26, 17, 14, "#776f69");
  ctx.strokeStyle = "#efc8ae"; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(64, 1343); ctx.lineTo(1016, 1343); ctx.stroke();
  fitted("过往业绩不预示未来表现，基金有风险，投资需谨慎。本材料仅供路演信息交流，不构成投资建议或收益承诺。", 64, 1354, 952, 52, 16, 13, "#776f69", 400, 1.4);
}

function renderAll() {
  const showLogo = images.logo && ((state.company === DEFAULT.company && !state.customMedia.logo) || (state.customMedia.logo && logoUploaded));
  const brandLogo = document.querySelector(".brand-logo");
  const brandName = document.getElementById("brandName");
  brandLogo.hidden = !showLogo;
  brandName.hidden = Boolean(showLogo);
  if (showLogo) brandLogo.src = images.logo.src;
  else brandName.textContent = state.company;
  status.textContent = state.verified ? "资料已人工核验" : "数据待核验";
  status.classList.toggle("status-verified", Boolean(state.verified));
  copyTextNode.textContent = formatText();
  copyButton.disabled = !state.verified;
  downloadButton.disabled = !state.verified;
  copyButton.title = state.verified ? "" : "请先完成资料核验";
  downloadButton.title = copyButton.title;
  renderPoster();
}

function fieldChanged(event) {
  const input = event.target;
  if (input.dataset.field) {
    state[input.dataset.field] = input.value;
    if (input.dataset.field === "managerCount") renderManagerFields();
  } else if (input.dataset.managerField) {
    const index = Number(input.dataset.managerIndex);
    state.managers[index] ||= { name: "", features: "" };
    state.managers[index][input.dataset.managerField] = input.value;
  } else return;
  state.verified = false;
  verifiedCheck.checked = false;
  persist();
  renderAll();
}
form.addEventListener("input", fieldChanged);
form.addEventListener("change", event => {
  if (event.target.dataset.field) fieldChanged(event);
});
verifiedCheck.addEventListener("change", () => {
  state.verified = verifiedCheck.checked;
  persist();
  renderAll();
});

document.getElementById("logoUpload").addEventListener("change", event => {
  const file = event.target.files?.[0];
  if (!file) return;
  loadImage(URL.createObjectURL(file), image => { images.logo = image; logoUploaded = true; });
  state.customMedia.logo = true;
  state.verified = false; verifiedCheck.checked = false; persist(); renderAll();
});
managerFields.addEventListener("change", event => {
  const index = Number(event.target.dataset.photoIndex);
  const file = event.target.files?.[0];
  if (!Number.isInteger(index) || !file) return;
  loadImage(URL.createObjectURL(file), image => { images.managers[index] = { image, custom: true }; });
  state.customMedia.managers[index] = true;
  state.verified = false; verifiedCheck.checked = false; persist(); renderAll();
});

copyButton.addEventListener("click", async () => {
  if (!state.verified) return;
  try { await navigator.clipboard.writeText(formatText()); showToast("文案已复制"); }
  catch { showToast("复制失败，请打开纯文字视图手动复制"); }
});
downloadButton.addEventListener("click", () => {
  if (!state.verified) return;
  canvas.toBlob(blob => {
    if (!blob) { showToast("海报导出失败"); return; }
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${state.product || "路演海报"}.png`;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, "image/png");
});
document.getElementById("resetButton").addEventListener("click", () => {
  state = structuredClone(DEFAULT);
  state.customMedia = { logo: false, managers: [false, false] };
  logoUploaded = false;
  loadImage("assets/yongying-logo.png", image => { images.logo = image; });
  defaultPhotoSources.forEach((item, index) => loadImage(item.src, image => { images.managers[index] = { image, crop: item.crop }; }));
  localStorage.removeItem(STORAGE_KEY);
  fillForm();
  showToast("已恢复示例");
});

function setTab(name) {
  const poster = name === "poster";
  document.getElementById("posterPanel").hidden = !poster;
  document.getElementById("copyPanel").hidden = poster;
  for (const [id, selected] of [["posterTab", poster], ["copyTab", !poster]]) {
    const button = document.getElementById(id);
    button.classList.toggle("active", selected);
    button.setAttribute("aria-selected", String(selected));
  }
}
document.getElementById("posterTab").addEventListener("click", () => setTab("poster"));
document.getElementById("copyTab").addEventListener("click", () => setTab("copy"));
fillForm();

