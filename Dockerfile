# Usar uma imagem base do Node.js
FROM node:18

# Criar diretório para o app
WORKDIR /app

# Copiar arquivos para o container
COPY package*.json ./
RUN npm install

# Copiar o restante do projeto
COPY . .

# Expor a porta usada no server.js
EXPOSE 3000

# Comando para iniciar o app
CMD ["node", "server.js"]
