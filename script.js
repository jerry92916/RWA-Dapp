/**
 * Web3 搶紅包邏輯模組
 * 假設環境：ethers.js v6
 */

const CONTRACT_ADDRESS = "0x45753cDC8e467031339F5B244FbE1f0C21A101d9";
const SEPOLIA_CHAIN_ID = "0xaa36a7"; // Sepolia 的 Hex ID

// 完整的 ABI (應包含你合約中所有的 function)
const CONTRACT_ABI = [
    "function claim() public",
    "function getRemainingAmount() public view returns (uint256)",
    "event RedPacketClaimed(address indexed user, uint256 amount)"
];

let provider;
let signer;
let redPacketContract;

/**
 * 1. 初始化與連接錢包
 */
async function connect() {
    if (!window.ethereum) {
        throw new Error("請先安裝 MetaMask 錢包");
    }

    // 初始化 Provider (連結瀏覽器錢包)
    provider = new ethers.BrowserProvider(window.ethereum);

    // 檢查並請求切換到 Sepolia 測試網 (UX 優化)
    const { chainId } = await provider.getNetwork();
    if (chainId !== 11155111n) {
        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: SEPOLIA_CHAIN_ID }],
            });
        } catch (switchError) {
            console.error("切換網路失敗", switchError);
        }
    }

    // 請求帳號授權
    signer = await provider.getSigner();
    const address = await signer.getAddress();

    // 實例化合約 (綁定 Signer 即可進行寫入操作)
    redPacketContract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

    return { address, provider };
}

/**
 * 2. 執行搶紅包交易
 */
async function claimRedPacket() {
    if (!redPacketContract) throw new Error("請先連接錢包");

    try {
        console.log("正在準備交易...");
        
        // 呼叫合約方法
        // 如果合約需要支付 Gas，ethers 會自動處理
        const tx = await redPacketContract.claim();
        
        console.log("交易已送出，Hash:", tx.hash);
        
        // 等待 1 個區塊確認 (Receipt)
        const receipt = await tx.wait();
        
        if (receipt.status === 1) {
            console.log("交易執行成功！");
            return { success: true, hash: tx.hash };
        } else {
            throw new Error("交易在鏈上執行失敗 (Reverted)");
        }
    } catch (error) {
        // 處理常見的 Web3 錯誤
        if (error.code === "ACTION_REJECTED") {
            throw new Error("用戶拒絕簽署交易");
        }
        throw error;
    }
}

/**
 * 3. 讀取合約狀態 (不需 Signer，僅需 Provider)
 */
async function checkContractBalance() {
    const balance = await provider.getBalance(CONTRACT_ADDRESS);
    return ethers.formatEther(balance);
}

// 匯出模組 (若使用 ES6 Modules)
// export { connect, claimRedPacket, checkContractBalance };
