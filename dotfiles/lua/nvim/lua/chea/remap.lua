vim.g.mapleader = " "
vim.keymap.set("n", "<leader>pv", vim.cmd.Ex)
vim.keymap.set("n", "<leader>ca", vim.lsp.buf.code_action)

-- nnoremap <silent> ca <cmd>lua vim.lsp.buf.code_action()<CR>
