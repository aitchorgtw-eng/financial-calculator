document.addEventListener('DOMContentLoaded', () => {
    // 1. 選取 DOM 元素
    const inputs = {
        housing: document.getElementById('in_housing'), // 1.1~1.3 月繳
        tax: document.getElementById('in_tax'),         // 1.4 年繳稅金
        utilities: document.getElementById('in_utilities'),
        cleaning: document.getElementById('in_cleaning'),
        others: document.getElementById('in_others'), // 交通費
        electricity: document.getElementById('in_electricity'), // 電費
        activities: document.getElementById('in_activities'), // [新增] 課程娛樂
        smart_care: document.getElementById('in_smart_care')  // [新增] 智慧照護
    };
    
    // 房型與加價選項
    const roomRadios = document.getElementsByName('room'); 
    const checkboxes = {
        partner: document.getElementById('check_partner'),
        care: document.getElementById('check_care')
    };

    // 房型價格區間定義 (Key 為 radio 的 value 中位數)
    const ROOM_RANGES = {
        34500: { min: 33000, max: 36000 }, // 經濟房
        46000: { min: 42000, max: 50000 }, // 一房一廳
        74000: { min: 70000, max: 78000 }  // 二房一廳 (預留)
    };

    // 2. 監聽所有輸入變更
    const allInputs = [...Object.values(inputs), ...roomRadios, ...Object.values(checkboxes)];
    
    allInputs.forEach(el => {
        if(el) {
            el.addEventListener('input', calculateAll);
        }
    });

    // 初始化
    calculateAll();

    // 3. 核心計算函數
    function calculateAll() {
        // --- 處理稅金換算 ---
        const housingMonthly = Number(inputs.housing.value) || 0;
        const taxAnnual = Number(inputs.tax.value) || 0;
        const taxMonthly = taxAnnual / 12;

        // A. 取得目前現況 (Current)
        const current = {
            housing: housingMonthly + taxMonthly, 
            utilities: Number(inputs.utilities.value) || 0,
            cleaning: Number(inputs.cleaning.value) || 0,
            others: Number(inputs.others.value) || 0,      // 交通
            electricity: Number(inputs.electricity.value) || 0, // 電費
            activities: Number(inputs.activities.value) || 0,   // [新增] 課程
            smart_care: Number(inputs.smart_care.value) || 0    // [新增] 照護
        };
        
        // 目前總開銷 (所有項目加總)
        const totalCurrent = 
            current.housing + 
            current.utilities + 
            current.cleaning + 
            current.others + 
            current.electricity + 
            current.activities + 
            current.smart_care;

        // B. 取得未來方案 (Future)
        let baseRent = 0;       // 用於月費比較 (中位數)
        let baseRentMin = 0;    // 用於資金區間 (最小值)
        let baseRentMax = 0;    // 用於資金區間 (最大值)

        for(let radio of roomRadios) {
            if(radio.checked) {
                const val = Number(radio.value);
                baseRent = val;
                
                // 查找對應的區間
                const range = ROOM_RANGES[val] || { min: val, max: val };
                baseRentMin = range.min;
                baseRentMax = range.max;
            }
        }
        
        // 計算加價 (配偶/看護)
        const extraFee = (checkboxes.partner.checked ? Number(checkboxes.partner.value) : 0) + 
                         (checkboxes.care.checked ? Number(checkboxes.care.value) : 0);
        
        // 月費試算 (中位數)
        const futureHousing = baseRent + extraFee;

        // 資金準備區間試算
        const futureHousingMin = baseRentMin + extraFee;
        const futureHousingMax = baseRentMax + extraFee;

        // C. 更新 UI 文字
        
        // --- 現況欄位 ---
        document.getElementById('out_housing_cur').textContent = `NT$ ${Math.round(current.housing).toLocaleString()}`;
        document.getElementById('out_util_cur').textContent = `NT$ ${current.utilities.toLocaleString()}`;
        document.getElementById('out_clean_cur').textContent = `NT$ ${current.cleaning.toLocaleString()}`;
        
        // 交通費
        const trafficDisplay = document.getElementById('out_traffic_cur');
        if(trafficDisplay) trafficDisplay.textContent = `NT$ ${current.others.toLocaleString()}`;

        // 電費
        const elecDisplayCur = document.getElementById('out_elec_cur');
        if(elecDisplayCur) elecDisplayCur.textContent = `NT$ ${current.electricity.toLocaleString()}`;

        // [新增] 課程與照護 (現況)
        const actDisplay = document.getElementById('out_act_cur');
        if(actDisplay) actDisplay.textContent = `NT$ ${current.activities.toLocaleString()}`;

        const careDisplay = document.getElementById('out_care_cur');
        if(careDisplay) careDisplay.textContent = `NT$ ${current.smart_care.toLocaleString()}`;
        
        // --- 未來欄位 ---
        document.getElementById('out_housing_fut').textContent = `NT$ ${futureHousing.toLocaleString()}`;
        
        const elecDisplayFut = document.getElementById('out_elec_fut');
        if(elecDisplayFut) elecDisplayFut.textContent = `NT$ ${current.electricity.toLocaleString()}`;
        
        // --- 總結算 ---
        // 未來總開銷 = 房租 + 電費 (其他項目如交通、課程、照護皆為 $0 內含)
        const totalFuture = futureHousing + current.electricity; 
        
        document.getElementById('total_current').textContent = `NT$ ${Math.round(totalCurrent).toLocaleString()}`;
        document.getElementById('total_future').textContent = `NT$ ${Math.round(totalFuture).toLocaleString()}`;

        // 差額計算
        const diff = totalFuture - totalCurrent;
        const diffBox = document.getElementById('diff_box');
        
        if (diffBox) {
            const absDiff = Math.abs(Math.round(diff));
            if(diff < 0) {
                diffBox.style.color = '#10b981';
                diffBox.textContent = `每月節省約 NT$ ${absDiff.toLocaleString()}`;
            } else {
                diffBox.style.color = '#f97316';
                diffBox.textContent = `每月增額約 NT$ ${absDiff.toLocaleString()} (換取全方位服務)`;
            }
        }

        // --- 一次性資金 (區間顯示) ---
        // 信託 (5年)
        const trustMin = (futureHousingMin * 60 / 10000).toFixed(1);
        const trustMax = (futureHousingMax * 60 / 10000).toFixed(1);
        
        // 保證金 (6個月)
        const depositMin = (futureHousingMin * 6 / 10000).toFixed(1);
        const depositMax = (futureHousingMax * 6 / 10000).toFixed(1);

        document.getElementById('val_trust').textContent = `${trustMin} ~ ${trustMax} 萬`;
        document.getElementById('val_deposit').textContent = `${depositMin} ~ ${depositMax} 萬`;
    }
});

// 4. 生成圖片功能 (維持不變)
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