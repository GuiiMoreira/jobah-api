// const EfiPay = require('efi-sdk-node');
const QRCode = require('qrcode');

const options = {
    client_id: process.env.EFI_CLIENT_ID,
    client_secret: process.env.EFI_CLIENT_SECRET,
    sandbox: true, // true para ambiente de testes
};

// const efi = new EfiPay(options);

async function createPixCharge(orderId, price) {
    const expirationInSeconds = 1800; // 30 minutos

    const body = {
        calendario: {
            expiracao: expirationInSeconds,
        },
        valor: {
            original: price.toFixed(2), // Formato "150.00"
        },
        chave: process.env.PIX_KEY, // Sua chave PIX cadastrada no PSP
        infoAdicionais: [
            { nome: 'Pedido', valor: orderId },
        ],
    };

    try {
        // O txid é o identificador único da transação
        const params = { txid: orderId };

        // Cria a cobrança imediata no PSP
        const pixCreationResponse = await efi.pixCreateImmediateCharge(params, body);

        // Pede para o PSP gerar o QR Code para essa cobrança
        const qrCodeResponse = await efi.pixGenerateQRCode({ loc: { id: pixCreationResponse.loc.id } });

        return {
            qrCodeImage: qrCodeResponse.imagemQrcode, // Já vem em base64
            qrCodeText: qrCodeResponse.qrcode,
            expiresAt: new Date(Date.now() + expirationInSeconds * 1000).toISOString(),
        };

    } catch (error) {
        console.error("Erro na API do PSP:", error);
        return null;
    }
}

async function createFakePixCharge(orderId, price) {
    console.log(`[MOCK] Gerando cobrança PIX falsa para o pedido: ${orderId} no valor de ${price.toFixed(2)}`);

    try {
        const expirationInSeconds = 1800; // 30 minutos



        // Um texto "Copia e Cola" falso, mas que inclui o ID do pedido para verificação
        const fakeQrCodeText = `00020126580014br.gov.bcb.pix0136${orderId}-fake-pix-txid-12345204000053039865405${price.toFixed(2)}5802BR5913Plataforma JOBAH6008Salvador62290525${orderId}-jobah-payment6304E3B7`;
        const fakeQrCodeImage = await QRCode.toDataURL(fakeQrCodeText);
        return {
            qrCodeImage: fakeQrCodeImage,
            qrCodeText: fakeQrCodeText,
            expiresAt: new Date(Date.now() + expirationInSeconds * 1000).toISOString(),
        };
    } catch (error) {
        console.error("Erro no serviço de pagamento simulado:", error);
        return null;
    }
}


module.exports = { createFakePixCharge, createPixCharge };