// finance-app-server/routes/auth.js
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

// Registro de usuário
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    // Verificar se o usuário já existe
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'E-mail já está em uso' });
    }
    
    // Criar o novo usuário
    const user = new User({
      name,
      email,
      password
    });
    
    await user.save();
    
    // Gerar token JWT
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN
    });
    
    res.status(201).json({
      message: 'Usuário criado com sucesso',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Erro ao registrar usuário:', error);
    res.status(500).json({ message: 'Erro ao registrar usuário' });
  }
});

// Login de usuário
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Buscar usuário pelo email (incluindo o campo password)
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      return res.status(401).json({ message: 'E-mail ou senha inválidos' });
    }
    
    // Verificar senha
    const isMatch = await user.comparePassword(password);
    
    if (!isMatch) {
      return res.status(401).json({ message: 'E-mail ou senha inválidos' });
    }
    
    // Gerar token JWT
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN
    });
    
    res.json({
      message: 'Login realizado com sucesso',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Erro ao fazer login:', error);
    res.status(500).json({ message: 'Erro ao fazer login' });
  }
});

// Recuperação de senha - Solicitar reset
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }
    
    // Gerar token para reset de senha
    const resetToken = crypto.randomBytes(20).toString('hex');
    
    // Definir data de expiração (1 hora)
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hora
    
    await user.save();
    
    // Configurar e-mail
    const mailOptions = {
      from: `"${process.env.MAIL_FROM_NAME || 'Finance App'}" <${process.env.MAIL_FROM_ADDRESS || 'mypet3765@gmail.com'}>`,
      to: user.email,
      subject: 'Finance App - Recuperação de Senha',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 5px;">
          <h1 style="color: #6200ee; text-align: center;">Recuperação de Senha</h1>
          <p>Olá,</p>
          <p>Você solicitou a recuperação da sua senha no aplicativo Finance App. Para redefinir sua senha, utilize o token abaixo no aplicativo:</p>
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; text-align: center; margin: 20px 0;">
            <code style="font-size: 20px; font-weight: bold;">${resetToken}</code>
          </div>
          <p><strong>Importante:</strong> Este token é válido por apenas 1 hora.</p>
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
      message: 'E-mail para recuperação de senha enviado',
      // Em ambiente de desenvolvimento, retornar o token para testes
      ...(process.env.NODE_ENV === 'development' && { token: resetToken })
    });
  } catch (error) {
    console.error('Erro na recuperação de senha:', error);
    res.status(500).json({ message: 'Erro no envio do e-mail de recuperação de senha' });
  }
});

// Redefinir senha com token
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    
    // Buscar usuário com o token
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });
    
    if (!user) {
      return res.status(400).json({ message: 'Token inválido ou expirado' });
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