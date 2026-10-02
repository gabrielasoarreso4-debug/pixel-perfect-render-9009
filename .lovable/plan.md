# Evolução: perfis, diárias, custos e nova calculadora

Mantém o visual e as telas atuais (cores Sinoslaser, menu inferior no celular, menu lateral no computador). Muda só o que o novo documento pede.

## O que muda para quem usa

**Login**
- A pessoa entra com **usuário + senha** (sem e-mail e sem cadastro público). A tela "Criar conta", "Esqueci minha senha" e o botão do Google saem.
- Só o admin cria clientes.
- Cliente bloqueada ou com acesso vencido vê: "Acesso indisponível, fale com o suporte" (com botão de WhatsApp 51 99558-2168).
- Depois do login: admin vai para `/admin`, cliente vai para `/home`.

**Painel Admin (`/admin`)**
- Clientes: criar (nome, usuário, senha), editar, ativar/bloquear, definir "acesso até". Destaque para quem vence em até 7 dias.
- Locações: criar (equipamento, início, fim, nº de diárias, 10h ou 12h, valor da diária), mudar status (agendada / ativa / encerrada). Ao encerrar, sugere "acesso até" = fim + 60 dias (editável).
- Equipamentos: editar nome, descrição, foto, valor padrão da diária, link de treinamento, link de marketing, enviar PDF de protocolos, ativar/desativar.
- Perguntas frequentes: cadastrar por equipamento ou gerais.
- Chamados de suporte: ver e responder (já existe a estrutura).
- Tudo manual — sem corte automático.

**Área da cliente**
- `/home`: "Olá, [nome]", cards dos equipamentos com foto e status (locado agora / disponível para consulta), resumo de diárias (contratadas, usadas, restantes, data de término), lucro líquido do mês com variação % vs. mês anterior (seta verde/vermelha).
- Avisos: "Sua locação termina em X dias" (até 3 dias) e "Você ainda não registrou os custos de hoje".
- Ficha do equipamento com abas: Visão geral, Calculadora, Treinamento (vídeo embutido se for YouTube/Drive), Protocolos (PDF na tela + baixar), Marketing (botão), Perguntas frequentes, Suporte.
- Botões de treinamento e marketing só aparecem quando houver link.

**Calculadora nova**
- Entradas: preço médio, procedimentos por diária, diárias trabalhadas, anúncio, aluguel (vem preenchido com o valor da diária da locação) e insumos.
- Mostra faturamento, custos, **lucro líquido** em destaque (verde/vermelho), lucro por diária e margem %.
- Botão "Salvar dia" grava o dia e alimenta o resumo da home.

**Equipamentos**
- Lista final: Ultraformer MPT, Delight 1470, Lavieen Thulium, Etherea MX, Light Sheer, Soprano, Ultraformer III, Hegon CO2, Ptolomeu, Elyon, Inkie, Laser Mini Premium, Laser Mini 4D, Criofrequência.
- Harmony XL fica oculto.

## Pontos que dependem de você
- **Fotos dos equipamentos**: o documento diz "fotos anexadas", mas nenhuma imagem chegou. Envie as fotos (nome do arquivo = nome do equipamento) que eu associo a cada um. Até lá, aparece o card roxo com o nome.
- **Primeiro admin**: vou criar o usuário admin `admin` — você me diz a senha que quer (ou eu gero uma e te passo).
- O cadastro anterior por e-mail e a regra automática de 60 dias deixam de valer (substituídos pelo controle manual).

## Detalhes técnicos
- Banco: substituir `clients` por `profiles` (nome, usuario único, acesso_ativo, acesso_ate); `user_roles` com papéis admin/cliente e `has_role`; `equipamentos` com links, protocolo_pdf_path e valor_diaria_padrao; `locacoes` com diárias, horas e valor; `custos_diarios`; `faq`. Remover o gatilho automático de acesso.
- RLS: cliente lê só as próprias locações, equipamentos vinculados a elas e os próprios custos; cria/edita só os próprios custos. Admin acesso total. Login bloqueado também no banco quando acesso inativo/vencido.
- Login com e-mail sintético `usuario@app.local`; criação de clientes por função de servidor protegida (verifica papel admin) usando a API administrativa de usuários, com confirmação automática.
- Storage: bucket privado `protocolos`; admin envia, cliente lê só PDFs dos seus equipamentos (URL assinada).
- Sem polling; consultas simples com cache.
