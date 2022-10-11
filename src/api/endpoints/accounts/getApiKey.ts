import mysql from '../../../common/mysql_worker';
import { IApiResponse } from '../../../common/apiTypes';
import { usePrisma } from '../..';
import { boolean, number, string, z, ZodError } from 'zod';
import opsUtils, { getSearchQuery, zValidNumber } from '../../../utils/opsUtils';
import { uuid } from 'uuidv4';

const Props = z.object({
    accountId: zValidNumber,
});

type IProps = z.infer<typeof Props>;

export default async function getApiKey(props: IProps): Promise<IApiResponse> {
    const aurora = mysql();
    try {
        let useProps = Props.parse(props);
        const { accountId } = useProps;

        let account = await usePrisma.account.findUnique({ where: { id: accountId } });

        let apiKey = account.hashedApiKey;

        return { data: { apiKey: apiKey } };
    } catch (e) {
        if (e instanceof ZodError) {
            console.log(e.flatten());
            //@ts-ignore
            return { error: e.flatten() };
        } else {
            throw e;
        }
    }
}
