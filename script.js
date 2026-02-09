document.addEventListener('DOMContentLoaded', () => {
    // 1. 選取 DOM 元素
    const inputs = {
        housing: document.getElementById('in_housing'), // 1.1~1.3 月繳
        tax: document.getElementById('in_tax'),         // [新增] 1.4 年繳稅金
        utilities: document.getElementById('in_utilities'),
        cleaning: document.getElementById('in_cleaning'),
        others: document.getElementById('in_others'), // 交通費
        electricity: document.getElementById('in_electricity') // 電費
    };
    
    const roomRadios = document.getElementsByName('room'); 
    
    const checkboxes = {
        partner: document.getElementById('check_partner'),
        care: document.getElementById('check_care')
    };

    // 2. 監聽所有輸入變更
    // 確保所有欄位 (包含新增的 tax) 都有被監聽
    const allInputs = [...Object.values(inputs), ...roomRadios, ...Object.values(checkboxes)];
    
    allInputs.forEach(el => {
        if(el) {
            el.addEventListener('input', calculateAll);
        }
    });

    // 初始化：頁面載入時先執行一次計算
    calculateAll();

    // 3. 核心計算函數
    function calculateAll() {
        // --- 處理稅金換算 ---
        const housingMonthly = Number(inputs.housing.value) || 0;
        const taxAnnual = Number(inputs.tax.value) || 0;
        const taxMonthly = taxAnnual / 12; // 年繳除以 12

        // A. 取得目前現況 (Current)
        const current = {
            // 居住成本 = 月繳項目 + (年繳稅金/12)
            housing: housingMonthly + taxMonthly, 
            utilities: Number(inputs.utilities.value) || 0,
            cleaning: Number(inputs.cleaning.value) || 0,
            others: Number(inputs.others.value) || 0, // 交通費
            electricity: Number(inputs.electricity.value) || 0 // 電費
        };
        
        // 目前總開銷
        const totalCurrent = current.housing + current.utilities + current.cleaning + current.others + current.electricity;

        // B. 取得未來方案 (Future)
        let baseRent = 0;
        for(let radio of roomRadios) {
            if(radio.checked) baseRent = Number(radio.value);
        }
        
        const extraFee = (checkboxes.partner.checked ? Number(checkboxes.partner.value) : 0) + 
                         (checkboxes.care.checked ? Number(checkboxes.care.value) : 0);
        
        const futureHousing = baseRent + extraFee;

        // C. 更新 UI 文字
        
        // --- 現況欄位 ---
        // 這裡顯示的金額已經包含稅金攤提
        document.getElementById('out_housing_cur').textContent = `NT$ ${Math.round(current.housing).toLocaleString()}`;
        document.getElementById('out_util_cur').textContent = `NT$ ${current.utilities.toLocaleString()}`;
        document.getElementById('out_clean_cur').textContent = `NT$ ${current.cleaning.toLocaleString()}`;
        
        // 交通費
        const trafficDisplay = document.getElementById('out_traffic_cur');
        if(trafficDisplay) trafficDisplay.textContent = `NT$ ${current.others.toLocaleString()}`;

        // 電費 (現況)
        const elecDisplayCur = document.getElementById('out_elec_cur');
        if(elecDisplayCur) elecDisplayCur.textContent = `NT$ ${current.electricity.toLocaleString()}`;
        
        // --- 未來欄位 ---
        document.getElementById('out_housing_fut').textContent = `NT$ ${futureHousing.toLocaleString()}`;
        
        // 電費 (未來 - 自動帶入相同金額)
        const elecDisplayFut = document.getElementById('out_elec_fut');
        if(elecDisplayFut) elecDisplayFut.textContent = `NT$ ${current.electricity.toLocaleString()}`;
        
        // --- 總結算 ---
        // 未來總開銷 = 房租 + 電費
        const totalFuture = futureHousing + current.electricity; 
        
        // 使用 Math.round 確保總額沒有小數點
        document.getElementById('total_current').textContent = `NT$ ${Math.round(totalCurrent).toLocaleString()}`;
        document.getElementById('total_future').textContent = `NT$ ${Math.round(totalFuture).toLocaleString()}`;

        // 差額計算
        const diff = totalFuture - totalCurrent;
        const diffBox = document.getElementById('diff_box');
        
        if (diffBox) {
            const absDiff = Math.abs(Math.round(diff));
            if(diff < 0) {
                diffBox.style.color = '#10b981'; // Green
                diffBox.textContent = `每月節省 NT$ ${absDiff.toLocaleString()}`;
            } else {
                diffBox.style.color = '#f97316'; // Orange
                diffBox.textContent = `每月增額 NT$ ${absDiff.toLocaleString()} (換取全方位服務)`;
            }
        }

        // 一次性資金 (僅計算房租基底)
        document.getElementById('val_trust').textContent = `約 NT$ ${(futureHousing * 60 / 10000).toFixed(1)} 萬`;
        document.getElementById('val_deposit').textContent = `約 NT$ ${(futureHousing * 6 / 10000).toFixed(1)} 萬`;
    }
});

// 4. 生成圖片功能
function generateImage() {
    if (typeof html2canvas === 'undefined') {
        alert("⚠️ 錯誤：無法啟動截圖工具。\n請確認網路連線是否正常。");
        return;
    }

    const element = document.getElementById('report-area');
    if (!element) {
        alert("找不到報告區塊");
        return;
    }

    const btn = document.querySelector('.btn-primary');
    const originalText = btn.textContent;
    btn.textContent = "生成圖片中...";
    btn.disabled = true;

    // 插入浮水印
    const watermark = document.createElement('div');
    watermark.style.cssText = "position:absolute; bottom:50%; left:20%; transform:rotate(-30deg); font-size:40px; color:rgba(200,0,0,0.15); font-weight:bold; pointer-events:none; z-index:999;";
    watermark.innerText = "僅供試算參考 • 非正式合約";
    element.style.position = "relative";
    element.appendChild(watermark);

    html2canvas(element, {
        scale: 2,
        backgroundColor: "#ffffff",
        scrollX: 0,
        scrollY: -window.scrollY
    })
    .then(canvas => {
        const imageUri = canvas.toDataURL("image/png");
        const link = document.createElement('a');
        const date = new Date();
        const timeStr = `${date.getFullYear()}${(date.getMonth()+1).toString().padStart(2,'0')}${date.getDate()}`;
        link.download = `日昇月好_財務試算報告_${timeStr}.png`;
        link.href = imageUri;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    })
    .catch(err => {
        console.error("截圖失敗:", err);
        alert("❌ 圖片生成失敗");
    })
    .finally(() => {
        if (element.contains(watermark)) element.removeChild(watermark);
        btn.textContent = originalText;
        btn.disabled = false;
    });
}