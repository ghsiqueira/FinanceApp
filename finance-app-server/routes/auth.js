// finance-app-server/routes/auth.js - Atualizado para gerar códigos de 5 dígitos

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const User = require('../models/User');

// Configuração do JWT
const JWT_SECRET = process.env.JWT_SECRET || 'sua_chave_secreta_muito_segura';
const JWT_EXPIRES_IN = '7d';

// Configurar Nodemailer com Gmail
const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.MAIL_PORT || '465'),
  secure: process.env.MAIL_ENCRYPTION === 'ssl', // true para SSL
  auth: {
    user: process.env.MAIL_USERNAME || 'mypet3765@gmail.com',
    pass: process.env.MAIL_PASSWORD || 'yqkwgvzvkayhnyxv'
  }
});

// Registro de usuário - manter o mesmo
router.post('/register', async (req, res) => { /* código existente */ });

// Login de usuário - manter o mesmo
router.post('/login', async (req, res) => { /* código existente */ });

// Recuperação de senha - Modificado para usar código de 5 dígitos
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }
    
    // Gerar código de 5 dígitos
    const resetCode = Math.floor(10000 + Math.random() * 90000).toString();
    
    // Definir data de expiração (1 hora)
    user.resetPasswordToken = resetCode;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hora
    
    await user.save();
    
    // Configurar e-mail com código de 5 dígitos
    const mailOptions = {
      from: `"${process.env.MAIL_FROM_NAME || 'Finance App'}" <${process.env.MAIL_FROM_ADDRESS || 'mypet3765@gmail.com'}>`,
      to: user.email,
      subject: 'Finance App - Código de Recuperação de Senha',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 5px;">
          <h1 style="color: #6200ee; text-align: center;">Recuperação de Senha</h1>
          <p>Olá ${user.name},</p>
          <p>Você solicitou a recuperação da sua senha no aplicativo Finance App. Use o código abaixo para redefinir sua senha:</p>
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; text-align: center; margin: 20px 0;">
            <h2 style="font-size: 24px; letter-spacing: 5px; font-weight: bold; color: #6200ee; margin: 0;">${resetCode}</h2>
          </div>
          <p><strong>Importante:</strong> Este código é válido por apenas 1 hora.</p>
          <p>Se você não solicitou esta recuperação, por favor ignore este e-mail ou entre em contato com nosso suporte.</p>
          <p style="margin-top: 30px; text-align: center; color: #666;">
            Finance App - Gerencie suas finanças com facilidade
          </p>
        </div>
      `
    };
    
    // Enviar e-mail
    await transporter.sendMail(mailOptions);
    
    res.json({ 
      message: 'Código para recuperação de senha enviado',
      // Em ambiente de desenvolvimento, retornar o código para testes
      ...(process.env.NODE_ENV === 'development' && { code: resetCode })
    });
  } catch (error) {
    console.error('Erro na recuperação de senha:', error);
    res.status(500).json({ message: 'Erro no envio do e-mail de recuperação de senha' });
  }
});

// Verificar código de recuperação - Nova rota
router.post('/verify-reset-code', async (req, res) => {
  try {
    const { email, code } = req.body;
    
    // Buscar usuário com o e-mail e código fornecidos
    const user = await User.findOne({
      email,
      resetPasswordToken: code,
      resetPasswordExpires: { $gt: Date.now() }
    });
    
    if (!user) {
      return res.status(400).json({ message: 'Código inválido ou expirado' });
    }
    
    // Código válido
    res.json({ 
      message: 'Código verificado com sucesso', 
      email: user.email 
    });
  } catch (error) {
    console.error('Erro ao verificar código:', error);
    res.status(500).json({ message: 'Erro ao verificar código de recuperação' });
  }
});

// Redefinir senha com código
router.post('/reset-password', async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;
    
    // Buscar usuário com o e-mail e código fornecidos
    const user = await User.findOne({
      email,
      resetPasswordToken: code,
      resetPasswordExpires: { $gt: Date.now() }
    });
    
    if (!user) {
      return res.status(400).json({ message: 'Código inválido ou expirado' });
    }
    
    // Atualizar senha
    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    
    await user.save();
    
    res.json({ message: 'Senha redefinida com sucesso' });
  } catch (error) {
    console.error('Erro ao redefinir senha:', error);
    res.status(500).json({ message: 'Erro ao redefinir senha' });
  }
});

module.exports = router;