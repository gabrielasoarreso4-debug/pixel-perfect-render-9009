# Arquitetura e checklist de segurança do MVP

## Escopo entendido

O repositório implementa um portal da Sinoslaser, uma única empresa de locação, com acesso de clientes. O MVP inclui autenticação por usuário e senha; cadastro e validade de acesso; catálogo de equipamentos; locações; biblioteca de protocolos e materiais; treinamentos e progresso; FAQ; chamados de suporte; e calculadora de custo/lucro diário.

Isso é um SaaS de portal para uma empresa hoje, não uma plataforma multiempresa. Para o MVP, mantenha um único espaço da Sinoslaser e isole os dados de cada cliente pela identidade autenticada e pelas políticas RLS. Se o produto passar a atender várias locadoras, acrescente `organization_id` a todas as tabelas e valide o tenant em cada política antes de vender esse cenário.

## Arquitetura mínima

- **Interface:** React + TanStack Start. O navegador usa somente a chave publicável do Supabase.
- **Servidor:** funções server-side do TanStack Start fazem operações administrativas. A chave service role fica no servidor e só é usada depois da checagem do papel admin.
- **Identidade:** Supabase Auth é a fonte de identidade; `profiles.id` deve corresponder a `auth.uid()`; `user_roles` controla o papel.
- **Dados:** Postgres mantém clientes, equipamentos, locações, FAQ, chamados e progresso. RLS deve restringir cada linha sensível a seu cliente ou a um administrador.
- **Arquivos:** PDFs e materiais privados devem ficar em bucket privado e ser entregues por URL assinada após checar acesso. Links públicos só para material deliberadamente público.
- **Implantação:** Vercel com Nitro no preset Vercel, Node.js 24+, variáveis separadas por ambiente e Supabase de preview separado do projeto de produção.

Não introduza microsserviços, filas ou múltiplas organizações no MVP: o projeto é um monólito pequeno, e os principais limites são autorização e isolamento de dados.

## Mudanças preparadas

1. Primeiro administrador exige um segredo temporário de pelo menos 32 caracteres, comparado no servidor em tempo constante. Sem a variável, o formulário de bootstrap não aparece. Configure-a apenas durante a instalação e remova-a depois de criar o administrador. A verificação final de “ainda não existe admin” continua no banco.
2. Novas senhas criadas ou redefinidas passam a exigir pelo menos 12 caracteres; o limite máximo permanece 72.
3. `.env` deixa de ser versionado e o modelo `.env.example` contém nomes sem credenciais.
4. O build Vercel escolhe explicitamente o preset Vercel do Nitro; builds fora da Vercel mantêm o preset já gerenciado pelo wrapper Lovable.
5. Node 24 fica explícito e testes unitários nativos verificam o segredo de bootstrap.

## Variáveis de ambiente

Configure na Vercel:

- Build/browser: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`.
- Servidor: `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
- Apenas para o primeiro administrador: `ADMIN_BOOTSTRAP_SECRET` (remover após concluir o bootstrap).

Não copie credenciais de produção para Preview. Use um projeto/branch Supabase separado para Preview e desenvolvimento. Chaves publicáveis são destinadas ao cliente e dependem de RLS correta; service role e segredos nunca recebem prefixo `VITE_`.

## Banco de dados e implantação

Há uma migration antiga no histórico que começa removendo tabelas existentes e papéis de usuário. Isso pode apagar dados se aplicada a um banco que já contenha dados. Não reescreva uma migration já aplicada. Antes de produção:

1. confira o histórico remoto de migrations e identifique se essa migration já foi aplicada;
2. faça backup e teste restauração;
3. valide migration/reset em uma base descartável e depois em Preview/staging com dados de teste;
4. não aplique migration destrutiva a produção sem plano de migração e restauração verificada;
5. promova para produção somente após validar o deploy de Preview e as políticas RLS.

Este trabalho não aplicou migrations nem alterou banco remoto.

## Validação manual antes do MVP

- Criar o primeiro admin só com o segredo válido; segredo ausente/inválido não cria conta; depois de remover a variável, não existe novo bootstrap.
- Admin cria cliente, altera senha e validade; cliente entra e vê apenas seus dados.
- Cliente A não consegue ler/alterar locações, chamados, arquivos ou progresso do cliente B, mesmo chamando APIs diretamente.
- Admin mantém equipamento, locação, FAQ, chamados, materiais e acessos; erros de permissão falham fechados.
- Arquivo privado não abre sem sessão/autorização; PDF correto abre para usuário autorizado.
- Fluxos de calculadora, treinamentos e suporte funcionam em desktop e celular; links externos e validações apresentam erros compreensíveis.
- Preview usa banco isolado; deploy Vercel mostra logs do servidor sem segredos e as rotas principais carregam após refresh.

## Pesquisa e referências

- [Vercel: TanStack Start](https://vercel.com/kb/guide/deploy-a-tanstack-start-app-to-vercel) e [Vite com Nitro](https://vercel.com/docs/frameworks/full-stack/vite-with-nitro): adaptação do servidor ao runtime e preset de implantação.
- [Supabase: proteger dados](https://supabase.com/docs/guides/database/secure-data): chaves publicáveis, chaves secretas e RLS.
- [Supabase: migrations e deploy](https://supabase.com/docs/guides/deployment/database-migrations): histórico versionado e promoção controlada.
- [AWS: isolamento de tenants](https://docs.aws.amazon.com/whitepapers/latest/saas-architecture-fundamentals/tenant-isolation.html): autenticação e autorização precisam impor isolamento entre clientes.
