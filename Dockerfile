# Usar imagem base do Node.js
FROM node:18

# Definir o diretório de trabalho dentro do container
WORKDIR /app

# Copiar os arquivos package.json e package-lock.json da pasta backend
COPY backend/package*.json ./

# Instalar as dependências
RUN npm install

# Copiar o restante dos arquivos da pasta backend para o container
COPY backend/ ./

# Expor a porta do servidor
EXPOSE 3000

# Comando para iniciar o servidor
CMD ["node", "server.js"]
